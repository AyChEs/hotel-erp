package com.ayches.hotelerp.hotel.repository;

import com.ayches.hotelerp.hotel.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByNameIgnoreCase(String name);
}
