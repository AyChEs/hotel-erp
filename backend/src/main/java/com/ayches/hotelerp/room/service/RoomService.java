package com.ayches.hotelerp.room.service;

import com.ayches.hotelerp.common.exception.BusinessRuleException;
import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.hotel.repository.HotelRepository;
import com.ayches.hotelerp.room.domain.Room;
import com.ayches.hotelerp.room.domain.RoomStatus;
import com.ayches.hotelerp.room.domain.RoomType;
import com.ayches.hotelerp.room.dto.RoomDto;
import com.ayches.hotelerp.room.dto.RoomRequest;
import com.ayches.hotelerp.room.mapper.RoomMapper;
import com.ayches.hotelerp.room.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomService {

    private final RoomRepository rooms;
    private final HotelRepository hotels;
    private final RoomMapper mapper;

    public PageResponse<RoomDto> search(Long hotelId, RoomType type, RoomStatus status,
                                        BigDecimal minPrice, BigDecimal maxPrice,
                                        Pageable pageable) {
        Specification<Room> spec = Specification.where(null);
        if (hotelId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("hotel").get("id"), hotelId));
        }
        if (type != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), type));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (minPrice != null) {
            spec = spec.and((root, q, cb) ->
                    cb.greaterThanOrEqualTo(root.get("pricePerNight"), minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and((root, q, cb) ->
                    cb.lessThanOrEqualTo(root.get("pricePerNight"), maxPrice));
        }
        return PageResponse.of(rooms.findAll(spec, pageable), mapper::toDto);
    }

    /** Public availability search — the entry point of the booking funnel. */
    public List<RoomDto> findAvailable(Long hotelId, LocalDate checkIn, LocalDate checkOut,
                                       short guests) {
        if (!checkOut.isAfter(checkIn)) {
            throw new BusinessRuleException("Check-out must be after check-in");
        }
        if (checkIn.isBefore(LocalDate.now())) {
            throw new BusinessRuleException("Check-in cannot be in the past");
        }
        return rooms.findAvailable(hotelId, guests, checkIn, checkOut)
                .stream().map(mapper::toDto).toList();
    }

    public RoomDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public RoomDto create(RoomRequest request) {
        if (rooms.existsByHotelIdAndNumber(request.hotelId(), request.number())) {
            throw new ConflictException("Room number already exists in this hotel");
        }
        Room room = mapper.toEntity(request);
        room.setHotel(hotels.findById(request.hotelId())
                .orElseThrow(() -> new NotFoundException("Hotel", request.hotelId())));
        return mapper.toDto(rooms.save(room));
    }

    @Transactional
    public RoomDto update(Long id, RoomRequest request) {
        Room room = getOrThrow(id);
        if (!room.getNumber().equals(request.number())
                && rooms.existsByHotelIdAndNumber(request.hotelId(), request.number())) {
            throw new ConflictException("Room number already exists in this hotel");
        }
        mapper.update(room, request);
        room.setHotel(hotels.findById(request.hotelId())
                .orElseThrow(() -> new NotFoundException("Hotel", request.hotelId())));
        return mapper.toDto(room);
    }

    @Transactional
    public void delete(Long id) {
        rooms.delete(getOrThrow(id));
    }

    private Room getOrThrow(Long id) {
        return rooms.findById(id).orElseThrow(() -> new NotFoundException("Room", id));
    }
}
