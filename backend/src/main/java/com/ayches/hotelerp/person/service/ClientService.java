package com.ayches.hotelerp.person.service;

import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.person.domain.Client;
import com.ayches.hotelerp.person.dto.ClientDto;
import com.ayches.hotelerp.person.dto.ClientRequest;
import com.ayches.hotelerp.person.mapper.ClientMapper;
import com.ayches.hotelerp.person.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientService {

    private final ClientRepository clients;
    private final ClientMapper mapper;

    public PageResponse<ClientDto> search(String search, Pageable pageable) {
        Specification<Client> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, q, cb) -> cb.or(
                    cb.like(cb.lower(root.get("firstName")), like),
                    cb.like(cb.lower(root.get("lastName")), like),
                    cb.like(cb.lower(root.get("documentId")), like)));
        }
        return PageResponse.of(clients.findAll(spec, pageable), mapper::toDto);
    }

    public ClientDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public ClientDto create(ClientRequest request) {
        if (clients.existsByDocumentId(request.documentId())) {
            throw new ConflictException("Document ID already registered");
        }
        return mapper.toDto(clients.save(mapper.toEntity(request)));
    }

    @Transactional
    public ClientDto update(Long id, ClientRequest request) {
        Client client = getOrThrow(id);
        if (!client.getDocumentId().equals(request.documentId())
                && clients.existsByDocumentId(request.documentId())) {
            throw new ConflictException("Document ID already registered");
        }
        mapper.update(client, request);
        return mapper.toDto(client);
    }

    @Transactional
    public void delete(Long id) {
        clients.delete(getOrThrow(id));
    }

    private Client getOrThrow(Long id) {
        return clients.findById(id).orElseThrow(() -> new NotFoundException("Client", id));
    }
}
