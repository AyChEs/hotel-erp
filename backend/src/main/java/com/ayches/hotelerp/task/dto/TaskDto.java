package com.ayches.hotelerp.task.dto;

import com.ayches.hotelerp.task.domain.TaskPriority;
import com.ayches.hotelerp.task.domain.TaskStatus;
import com.ayches.hotelerp.task.domain.TaskType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record TaskDto(
        Long id, String title, String description, TaskType type,
        TaskStatus status, TaskPriority priority, LocalDate dueDate, Instant completedAt,
        Long hotelId, String hotelName, Long roomId, String roomNumber,
        List<AssigneeDto> assignees) {

    public record AssigneeDto(Long id, String fullName) {
    }
}
