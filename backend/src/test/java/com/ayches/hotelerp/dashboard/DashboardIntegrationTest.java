package com.ayches.hotelerp.dashboard;

import com.ayches.hotelerp.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
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
class DashboardIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String managerToken() throws Exception {
        var result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"manager@hotel-erp.dev\",\"password\":\"Manager123!\"}"))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void summaryExposesKpisForManagers() throws Exception {
        var result = mvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + managerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalHotels").value(3))
                .andReturn();

        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("totalRooms").asLong()).isGreaterThanOrEqualTo(10);
        assertThat(body.get("occupancyRateToday").asDouble()).isBetween(0.0, 100.0);
        assertThat(body.get("bookingsByStatus").isObject()).isTrue();
    }

    @Test
    void revenueSeriesIsZeroFilledAndOrdered() throws Exception {
        var result = mvc.perform(get("/api/dashboard/revenue").param("months", "6")
                        .header("Authorization", "Bearer " + managerToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode points = json.readTree(result.getResponse().getContentAsString()).get("points");
        assertThat(points).hasSize(6);
        assertThat(points.get(5).get("month").asText())
                .isEqualTo(java.time.YearMonth.now().toString());
    }

    @Test
    void occupancySeriesCoversEveryDayInRange() throws Exception {
        var result = mvc.perform(get("/api/dashboard/occupancy")
                        .param("from", "2026-07-01").param("to", "2026-07-07")
                        .header("Authorization", "Bearer " + managerToken()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode points = json.readTree(result.getResponse().getContentAsString()).get("points");
        assertThat(points).hasSize(7);
        assertThat(points.get(0).get("date").asText()).isEqualTo("2026-07-01");
        assertThat(points.get(0).get("totalRooms").asLong()).isGreaterThan(0);
    }

    @Test
    void invalidRangesAreRejected() throws Exception {
        mvc.perform(get("/api/dashboard/occupancy")
                        .param("from", "2026-07-10").param("to", "2026-07-01")
                        .header("Authorization", "Bearer " + managerToken()))
                .andExpect(status().isUnprocessableEntity());

        mvc.perform(get("/api/dashboard/revenue").param("months", "0")
                        .header("Authorization", "Bearer " + managerToken()))
                .andExpect(status().isUnprocessableEntity());
    }
}
