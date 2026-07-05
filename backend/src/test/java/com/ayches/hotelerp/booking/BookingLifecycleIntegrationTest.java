package com.ayches.hotelerp.booking;

import com.ayches.hotelerp.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BookingLifecycleIntegrationTest extends AbstractIntegrationTest {

    // Dates far in the future so they never collide with seeded bookings
    private static final String CHECK_IN = "2027-03-01";
    private static final String CHECK_OUT = "2027-03-04";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String token(String email, String password) throws Exception {
        var result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private JsonNode bookAsClient(String checkIn, String checkOut, long roomId) throws Exception {
        String clientToken = token("client@hotel-erp.dev", "Client123!");
        var result = mvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"roomId":%d,"checkInDate":"%s","checkOutDate":"%s",
                                 "guests":2,"boardType":"HALF_BOARD"}"""
                                .formatted(roomId, checkIn, checkOut)))
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void fullLifecycleFromBookingToPaidInvoice() throws Exception {
        JsonNode booking = bookAsClient(CHECK_IN, CHECK_OUT, 2);
        long id = booking.get("id").asLong();
        assertThat(booking.get("status").asText()).isEqualTo("PENDING");
        assertThat(booking.get("code").asText()).startsWith("BK-");

        String reception = token("reception@hotel-erp.dev", "Reception123!");

        // Overlapping booking for the same room conflicts
        String clientToken = token("client@hotel-erp.dev", "Client123!");
        mvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"roomId":2,"checkInDate":"2027-03-03","checkOutDate":"2027-03-05",
                                 "guests":1,"boardType":"ROOM_ONLY"}"""))
                .andExpect(status().isConflict());

        // Check-in before confirmation is rejected (invalid transition)
        mvc.perform(post("/api/bookings/" + id + "/check-in")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(status().isUnprocessableEntity());

        // Confirm → check-in (room becomes OCCUPIED) → check-out (room CLEANING + auto task)
        mvc.perform(post("/api/bookings/" + id + "/confirm")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        mvc.perform(post("/api/bookings/" + id + "/check-in")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(status().isOk());
        mvc.perform(get("/api/rooms/2").header("Authorization", "Bearer " + reception))
                .andExpect(jsonPath("$.status").value("OCCUPIED"));

        mvc.perform(post("/api/bookings/" + id + "/check-out")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CHECKED_OUT"));
        mvc.perform(get("/api/rooms/2").header("Authorization", "Bearer " + reception))
                .andExpect(jsonPath("$.status").value("CLEANING"));

        mvc.perform(get("/api/tasks").param("type", "CLEANING")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(jsonPath("$.content[?(@.title =~ /Turnover cleaning.*/)]").exists());

        // Invoice: generate (10% VAT breakdown), duplicate conflicts, then mark paid
        var invoiceResult = mvc.perform(post("/api/invoices")
                        .header("Authorization", "Bearer " + reception)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":%d,\"paymentMethod\":\"CARD\"}".formatted(id)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceNumber").value(
                        org.hamcrest.Matchers.startsWith("INV-")))
                .andReturn();
        JsonNode invoice = json.readTree(invoiceResult.getResponse().getContentAsString());
        double subtotal = invoice.get("subtotal").asDouble();
        double vat = invoice.get("vatAmount").asDouble();
        double total = invoice.get("total").asDouble();
        assertThat(subtotal + vat).isCloseTo(total, org.assertj.core.data.Offset.offset(0.011));
        assertThat(booking.get("totalPrice").asDouble()).isEqualTo(total);

        mvc.perform(post("/api/invoices").header("Authorization", "Bearer " + reception)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"bookingId\":%d,\"paymentMethod\":\"CASH\"}".formatted(id)))
                .andExpect(status().isConflict());

        mvc.perform(post("/api/invoices/" + invoice.get("id").asLong() + "/pay")
                        .header("Authorization", "Bearer " + reception))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAID"));

        // Client sees the invoice under /api/me/invoices
        mvc.perform(get("/api/me/invoices").header("Authorization", "Bearer " + clientToken))
                .andExpect(jsonPath("$.content[?(@.bookingId == %d)]".formatted(id)).exists());
    }

    @Test
    void clientCanCancelOwnPendingBookingOnly() throws Exception {
        JsonNode booking = bookAsClient("2027-05-01", "2027-05-03", 3);
        long id = booking.get("id").asLong();
        String clientToken = token("client@hotel-erp.dev", "Client123!");

        mvc.perform(post("/api/me/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Cancelling again is an invalid transition
        mvc.perform(post("/api/me/bookings/" + id + "/cancel")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void guestsAboveCapacityRejected() throws Exception {
        String clientToken = token("client@hotel-erp.dev", "Client123!");
        mvc.perform(post("/api/me/bookings")
                        .header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"roomId":1,"checkInDate":"2027-06-01","checkOutDate":"2027-06-02",
                                 "guests":9,"boardType":"ROOM_ONLY"}"""))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void sameDayTurnoverIsAllowed() throws Exception {
        // Booking B starts exactly when A ends (half-open interval)
        bookAsClient("2027-07-01", "2027-07-03", 4);
        JsonNode second = bookAsClient("2027-07-03", "2027-07-05", 4);
        assertThat(second.get("status").asText()).isEqualTo("PENDING");
    }
}
