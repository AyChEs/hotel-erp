package com.ayches.hotelerp.task.dto;

import com.ayches.hotelerp.task.domain.TaskPriority;
import com.ayches.hotelerp.task.domain.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.Set;

public record TaskRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 1000) String description,
        @NotNull TaskType type,
        @NotNull TaskPriority priority,
        LocalDate dueDate,
        @NotNull Long hotelId,
        Long roomId,
        Set<Long> assigneeIds) {
}
