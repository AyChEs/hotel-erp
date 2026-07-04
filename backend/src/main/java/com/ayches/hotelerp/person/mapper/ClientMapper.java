package com.ayches.hotelerp.person.mapper;

import com.ayches.hotelerp.person.domain.Client;
import com.ayches.hotelerp.person.dto.ClientDto;
import com.ayches.hotelerp.person.dto.ClientRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface ClientMapper {

    @Mapping(target = "email", source = "user.email")
    ClientDto toDto(Client client);

    Client toEntity(ClientRequest request);

    void update(@MappingTarget Client client, ClientRequest request);
}
