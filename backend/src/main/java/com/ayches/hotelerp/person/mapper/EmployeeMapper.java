package com.ayches.hotelerp.person.mapper;

import com.ayches.hotelerp.person.domain.Employee;
import com.ayches.hotelerp.person.dto.EmployeeDto;
import com.ayches.hotelerp.person.dto.EmployeeRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface EmployeeMapper {

    @Mapping(target = "hotelId", source = "hotel.id")
    @Mapping(target = "hotelName", source = "hotel.name")
    @Mapping(target = "email", source = "user.email")
    EmployeeDto toDto(Employee employee);

    @Mapping(target = "hotel", ignore = true)
    Employee toEntity(EmployeeRequest request);

    @Mapping(target = "hotel", ignore = true)
    void update(@MappingTarget Employee employee, EmployeeRequest request);
}
