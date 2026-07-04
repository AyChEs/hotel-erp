package com.ayches.hotelerp.auth;

import com.ayches.hotelerp.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
class AuthFlowIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private JsonNode login(String email, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    @Test
    void loginReturnsTokensAndUserSummary() throws Exception {
        JsonNode body = login("admin@hotel-erp.dev", "Admin123!");
        org.assertj.core.api.Assertions.assertThat(body.get("accessToken").asText()).isNotBlank();
        org.assertj.core.api.Assertions.assertThat(body.get("refreshToken").asText()).isNotBlank();
        org.assertj.core.api.Assertions.assertThat(body.get("user").get("role").asText()).isEqualTo("ADMIN");
    }

    @Test
    void loginWithWrongPasswordIs401() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@hotel-erp.dev\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Authentication failed"));
    }

    @Test
    void refreshRotatesTokenAndDetectsReuse() throws Exception {
        String refresh1 = login("client@hotel-erp.dev", "Client123!").get("refreshToken").asText();

        // First refresh succeeds and returns a different token
        MvcResult refreshed = mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(refresh1)))
                .andExpect(status().isOk())
                .andReturn();
        String refresh2 = json.readTree(refreshed.getResponse().getContentAsString())
                .get("refreshToken").asText();
        org.assertj.core.api.Assertions.assertThat(refresh2).isNotEqualTo(refresh1);

        // Reusing the rotated (revoked) token fails AND revokes the whole family
        mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(refresh1)))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"%s\"}".formatted(refresh2)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerCreatesClientAccountAndRejectsDuplicates() throws Exception {
        String payload = """
                {"email":"new.user@example.dev","password":"Newuser1!",
                 "firstName":"New","lastName":"User","documentId":"CLI-9999","phone":"+34 600 000 000"}""";

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("CLIENT"));

        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict());
    }

    @Test
    void registerValidatesWeakPasswords() throws Exception {
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"weak@example.dev","password":"weakpass",
                                 "firstName":"W","lastName":"P","documentId":"CLI-8888"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void protectedEndpointRequiresTokenAndRole() throws Exception {
        // No token -> 401
        mvc.perform(get("/api/dashboard/summary")).andExpect(status().isUnauthorized());

        // CLIENT token on ADMIN/MANAGER endpoint -> 403
        String clientToken = login("client@hotel-erp.dev", "Client123!").get("accessToken").asText();
        mvc.perform(get("/api/dashboard/summary")
                        .header("Authorization", "Bearer " + clientToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void publicBrowsingNeedsNoToken() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk());
    }
}
