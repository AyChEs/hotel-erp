package com.ayches.hotelerp.task.web;

import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.task.domain.TaskStatus;
import com.ayches.hotelerp.task.domain.TaskType;
import com.ayches.hotelerp.task.dto.TaskDto;
import com.ayches.hotelerp.task.dto.TaskRequest;
import com.ayches.hotelerp.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Housekeeping & maintenance tasks")
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RECEPTIONIST')")
public class TaskController {

    private final TaskService service;

    @GetMapping
    public PageResponse<TaskDto> search(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskType type,
            @RequestParam(required = false) Long assigneeId,
            @ParameterObject @PageableDefault(size = 20, sort = "dueDate",
                    direction = Sort.Direction.ASC) Pageable pageable) {
        return service.search(hotelId, status, type, assigneeId, pageable);
    }

    @GetMapping("/{id}")
    public TaskDto get(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public ResponseEntity<TaskDto> create(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public TaskDto update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return service.update(id, request);
    }

    @Operation(summary = "Move a task through its lifecycle (PENDING → IN_PROGRESS → DONE / CANCELLED)")
    @PostMapping("/{id}/status/{status}")
    public TaskDto changeStatus(@PathVariable Long id, @PathVariable TaskStatus status) {
        return service.changeStatus(id, status);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
