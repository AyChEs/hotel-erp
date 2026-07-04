package com.ayches.hotelerp.hotel.service;

import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.hotel.domain.Category;
import com.ayches.hotelerp.hotel.domain.Hotel;
import com.ayches.hotelerp.hotel.dto.HotelDto;
import com.ayches.hotelerp.hotel.dto.HotelRequest;
import com.ayches.hotelerp.hotel.mapper.HotelMapper;
import com.ayches.hotelerp.hotel.repository.CategoryRepository;
import com.ayches.hotelerp.hotel.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HotelService {

    private final HotelRepository hotels;
    private final CategoryRepository categories;
    private final HotelMapper mapper;

    public PageResponse<HotelDto> search(String city, Long categoryId, Boolean active,
                                         String search, Pageable pageable) {
        Specification<Hotel> spec = Specification.where(null);
        if (city != null && !city.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(cb.lower(root.get("city")), city.toLowerCase()));
        }
        if (categoryId != null) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId));
        }
        if (active != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("active"), active));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and((root, q, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"));
        }
        return PageResponse.of(hotels.findAll(spec, pageable), mapper::toDto);
    }

    public HotelDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public HotelDto create(HotelRequest request) {
        Hotel hotel = mapper.toEntity(request);
        hotel.setCategory(categoryOrThrow(request.categoryId()));
        return mapper.toDto(hotels.save(hotel));
    }

    @Transactional
    public HotelDto update(Long id, HotelRequest request) {
        Hotel hotel = getOrThrow(id);
        mapper.update(hotel, request);
        hotel.setCategory(categoryOrThrow(request.categoryId()));
        return mapper.toDto(hotel);
    }

    @Transactional
    public void delete(Long id) {
        hotels.delete(getOrThrow(id));
    }

    private Hotel getOrThrow(Long id) {
        return hotels.findById(id).orElseThrow(() -> new NotFoundException("Hotel", id));
    }

    private Category categoryOrThrow(Long id) {
        return categories.findById(id).orElseThrow(() -> new NotFoundException("Category", id));
    }
}
