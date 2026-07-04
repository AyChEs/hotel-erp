package com.ayches.hotelerp.hotel.service;

import com.ayches.hotelerp.common.exception.ConflictException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.hotel.domain.Category;
import com.ayches.hotelerp.hotel.dto.CategoryDto;
import com.ayches.hotelerp.hotel.dto.CategoryRequest;
import com.ayches.hotelerp.hotel.mapper.CategoryMapper;
import com.ayches.hotelerp.hotel.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categories;
    private final CategoryMapper mapper;

    public List<CategoryDto> findAll() {
        return categories.findAll().stream().map(mapper::toDto).toList();
    }

    public CategoryDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public CategoryDto create(CategoryRequest request) {
        if (categories.existsByNameIgnoreCase(request.name())) {
            throw new ConflictException("Category name already exists");
        }
        return mapper.toDto(categories.save(mapper.toEntity(request)));
    }

    @Transactional
    public CategoryDto update(Long id, CategoryRequest request) {
        Category category = getOrThrow(id);
        mapper.update(category, request);
        return mapper.toDto(category);
    }

    @Transactional
    public void delete(Long id) {
        categories.delete(getOrThrow(id));
    }

    private Category getOrThrow(Long id) {
        return categories.findById(id).orElseThrow(() -> new NotFoundException("Category", id));
    }
}
