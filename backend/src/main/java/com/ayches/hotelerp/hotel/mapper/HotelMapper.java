package com.ayches.hotelerp.hotel.mapper;

import com.ayches.hotelerp.hotel.domain.Hotel;
import com.ayches.hotelerp.hotel.dto.HotelDto;
import com.ayches.hotelerp.hotel.dto.HotelRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(uses = CategoryMapper.class)
public interface HotelMapper {

    HotelDto toDto(Hotel hotel);

    @Mapping(target = "category", ignore = true)
    Hotel toEntity(HotelRequest request);

    @Mapping(target = "category", ignore = true)
    void update(@MappingTarget Hotel hotel, HotelRequest request);
}
