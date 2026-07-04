package com.ayches.hotelerp.person.repository;

import com.ayches.hotelerp.person.domain.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long>, JpaSpecificationExecutor<Client> {
    Optional<Client> findByUserId(Long userId);
    Optional<Client> findByUserEmail(String email);
    boolean existsByDocumentId(String documentId);
}
