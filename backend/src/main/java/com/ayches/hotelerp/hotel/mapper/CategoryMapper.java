package com.ayches.hotelerp.hotel.mapper;

import com.ayches.hotelerp.hotel.domain.Category;
import com.ayches.hotelerp.hotel.dto.CategoryDto;
import com.ayches.hotelerp.hotel.dto.CategoryRequest;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper
public interface CategoryMapper {

    CategoryDto toDto(Category category);

    Category toEntity(CategoryRequest request);

    void update(@MappingTarget Category category, CategoryRequest request);
}
