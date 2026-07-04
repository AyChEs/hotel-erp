package com.ayches.hotelerp.crud;

import com.ayches.hotelerp.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
class CoreCrudIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String token(String email, String password) throws Exception {
        var result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    // ---------- public browsing ----------

    @Test
    void hotelsAreBrowsableWithoutAuthAndFilterByCity() throws Exception {
        mvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));

        mvc.perform(get("/api/hotels").param("city", "granada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Alhambra Palace"));
    }

    @Test
    void roomsFilterByHotelAndPrice() throws Exception {
        mvc.perform(get("/api/rooms")
                        .param("hotelId", "1").param("maxPrice", "150"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].pricePerNight",
                        org.hamcrest.Matchers.everyItem(
                                org.hamcrest.Matchers.lessThanOrEqualTo(150.0))));
    }

    @Test
    void availabilityRejectsInvalidDateRange() throws Exception {
        mvc.perform(get("/api/rooms/available")
                        .param("hotelId", "1")
                        .param("checkIn", "2026-09-10")
                        .param("checkOut", "2026-09-08"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------- role-gated writes ----------

    @Test
    void hotelWritesRequireAdmin() throws Exception {
        String body = """
                {"name":"Test Hotel","address":"Street 1","city":"Sevilla","country":"Spain",
                 "active":true,"categoryId":3}""";

        mvc.perform(post("/api/hotels").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());

        String clientToken = token("client@hotel-erp.dev", "Client123!");
        mvc.perform(post("/api/hotels").header("Authorization", "Bearer " + clientToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());

        String adminToken = token("admin@hotel-erp.dev", "Admin123!");
        var created = mvc.perform(post("/api/hotels").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.name").value("Standard 3 Stars"))
                .andReturn();

        long id = json.readTree(created.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(delete("/api/hotels/" + id).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void managerCanCreateRoomsAndDuplicateNumberConflicts() throws Exception {
        String managerToken = token("manager@hotel-erp.dev", "Manager123!");
        String body = """
                {"number":"T-100","floor":1,"type":"DOUBLE","status":"AVAILABLE","capacity":2,
                 "pricePerNight":99.50,"halfBoardSupplement":10,"fullBoardSupplement":20,"hotelId":1}""";

        mvc.perform(post("/api/rooms").header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/rooms").header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void receptionistManagesClientsButCannotSeeEmployees() throws Exception {
        String receptionToken = token("reception@hotel-erp.dev", "Reception123!");

        mvc.perform(get("/api/clients").header("Authorization", "Bearer " + receptionToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/employees").header("Authorization", "Bearer " + receptionToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationErrorsListFields() throws Exception {
        String adminToken = token("admin@hotel-erp.dev", "Admin123!");
        mvc.perform(post("/api/hotels").header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"active\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.city").exists());
    }
}
