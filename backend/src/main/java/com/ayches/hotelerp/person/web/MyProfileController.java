package com.ayches.hotelerp.person.web;

import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.person.domain.Client;
import com.ayches.hotelerp.person.dto.ClientDto;
import com.ayches.hotelerp.person.dto.MyProfileRequest;
import com.ayches.hotelerp.person.mapper.ClientMapper;
import com.ayches.hotelerp.person.repository.ClientRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Tag(name = "My profile (client)")
@RestController
@RequestMapping("/api/me/profile")
@RequiredArgsConstructor
public class MyProfileController {

    private final ClientRepository clients;
    private final ClientMapper mapper;

    @GetMapping
    @Transactional(readOnly = true)
    public ClientDto get(Authentication auth) {
        return mapper.toDto(getClient(auth));
    }

    @PutMapping
    @Transactional
    public ClientDto update(Authentication auth, @Valid @RequestBody MyProfileRequest request) {
        Client client = getClient(auth);
        client.setFirstName(request.firstName());
        client.setLastName(request.lastName());
        client.setBirthDate(request.birthDate());
        client.setPhone(request.phone());
        client.setAddress(request.address());
        return mapper.toDto(client);
    }

    private Client getClient(Authentication auth) {
        return clients.findByUserEmail(auth.getName())
                .orElseThrow(() -> new NotFoundException("No client profile for " + auth.getName()));
    }
}
