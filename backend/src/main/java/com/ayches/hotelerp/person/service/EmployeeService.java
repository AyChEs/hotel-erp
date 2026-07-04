package com.ayches.hotelerp.person.service;

import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.hotel.repository.HotelRepository;
import com.ayches.hotelerp.person.domain.Employee;
import com.ayches.hotelerp.person.domain.EmployeePosition;
import com.ayches.hotelerp.person.domain.EmployeeStatus;
import com.ayches.hotelerp.person.dto.EmployeeDto;
import com.ayches.hotelerp.person.dto.EmployeeRequest;
import com.ayches.hotelerp.person.mapper.EmployeeMapper;
import com.ayches.hotelerp.person.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employees;
    private final HotelRepository hotels;
    private final EmployeeMapper mapper;

    public PageResponse<EmployeeDto> search(Long hotelId, EmployeePosition position,
                                            EmployeeStatus status, Pageable pageable) {
        Specification<Employee> spec = Specification.where(null);
        if (hotelId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("hotel").get("id"), hotelId));
        }
        if (position != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("position"), position));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        return PageResponse.of(employees.findAll(spec, pageable), mapper::toDto);
    }

    public EmployeeDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public EmployeeDto create(EmployeeRequest request) {
        if (employees.existsByDocumentId(request.documentId())) {
            throw new ConflictException("Document ID already registered");
        }
        Employee employee = mapper.toEntity(request);
        applyHotel(employee, request.hotelId());
        return mapper.toDto(employees.save(employee));
    }

    @Transactional
    public EmployeeDto update(Long id, EmployeeRequest request) {
        Employee employee = getOrThrow(id);
        if (!employee.getDocumentId().equals(request.documentId())
                && employees.existsByDocumentId(request.documentId())) {
            throw new ConflictException("Document ID already registered");
        }
        mapper.update(employee, request);
        applyHotel(employee, request.hotelId());
        return mapper.toDto(employee);
    }

    @Transactional
    public void delete(Long id) {
        employees.delete(getOrThrow(id));
    }

    private void applyHotel(Employee employee, Long hotelId) {
        if (hotelId == null) {
            employee.setHotel(null);
            return;
        }
        employee.setHotel(hotels.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel", hotelId)));
    }

    private Employee getOrThrow(Long id) {
        return employees.findById(id).orElseThrow(() -> new NotFoundException("Employee", id));
    }
}
