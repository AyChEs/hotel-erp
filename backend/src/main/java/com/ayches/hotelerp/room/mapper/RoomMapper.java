package com.ayches.hotelerp.room.mapper;

import com.ayches.hotelerp.room.domain.Room;
import com.ayches.hotelerp.room.dto.RoomDto;
import com.ayches.hotelerp.room.dto.RoomRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface RoomMapper {

    @Mapping(target = "hotelId", source = "hotel.id")
    @Mapping(target = "hotelName", source = "hotel.name")
    RoomDto toDto(Room room);

    @Mapping(target = "hotel", ignore = true)
    Room toEntity(RoomRequest request);

    @Mapping(target = "hotel", ignore = true)
    void update(@MappingTarget Room room, RoomRequest request);
}
