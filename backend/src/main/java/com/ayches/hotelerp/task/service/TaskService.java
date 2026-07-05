package com.ayches.hotelerp.task.service;

import com.ayches.hotelerp.common.exception.BusinessRuleException;
import com.ayches.hotelerp.common.exception.NotFoundException;
import com.ayches.hotelerp.common.web.PageResponse;
import com.ayches.hotelerp.hotel.repository.HotelRepository;
import com.ayches.hotelerp.person.repository.EmployeeRepository;
import com.ayches.hotelerp.room.repository.RoomRepository;
import com.ayches.hotelerp.task.domain.Task;
import com.ayches.hotelerp.task.domain.TaskStatus;
import com.ayches.hotelerp.task.domain.TaskType;
import com.ayches.hotelerp.task.dto.TaskDto;
import com.ayches.hotelerp.task.dto.TaskRequest;
import com.ayches.hotelerp.task.mapper.TaskMapper;
import com.ayches.hotelerp.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaskService {

    private final TaskRepository tasks;
    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final EmployeeRepository employees;
    private final TaskMapper mapper;

    public PageResponse<TaskDto> search(Long hotelId, TaskStatus status, TaskType type,
                                        Long assigneeId, Pageable pageable) {
        Specification<Task> spec = Specification.where(null);
        if (hotelId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("hotel").get("id"), hotelId));
        }
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (type != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("type"), type));
        }
        if (assigneeId != null) {
            spec = spec.and((root, q, cb) ->
                    cb.equal(root.join("assignees").get("id"), assigneeId));
        }
        return PageResponse.of(tasks.findAll(spec, pageable), mapper::toDto);
    }

    public TaskDto findById(Long id) {
        return mapper.toDto(getOrThrow(id));
    }

    @Transactional
    public TaskDto create(TaskRequest request) {
        Task task = new Task();
        apply(task, request);
        return mapper.toDto(tasks.save(task));
    }

    @Transactional
    public TaskDto update(Long id, TaskRequest request) {
        Task task = getOrThrow(id);
        apply(task, request);
        return mapper.toDto(task);
    }

    @Transactional
    public TaskDto changeStatus(Long id, TaskStatus newStatus) {
        Task task = getOrThrow(id);
        if (task.getStatus() == TaskStatus.DONE || task.getStatus() == TaskStatus.CANCELLED) {
            throw new BusinessRuleException("Task is already closed");
        }
        task.setStatus(newStatus);
        task.setCompletedAt(newStatus == TaskStatus.DONE ? Instant.now() : null);
        return mapper.toDto(task);
    }

    @Transactional
    public void delete(Long id) {
        tasks.delete(getOrThrow(id));
    }

    private void apply(Task task, TaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setType(request.type());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
        task.setHotel(hotels.findById(request.hotelId())
                .orElseThrow(() -> new NotFoundException("Hotel", request.hotelId())));
        task.setRoom(request.roomId() == null ? null
                : rooms.findById(request.roomId())
                        .orElseThrow(() -> new NotFoundException("Room", request.roomId())));
        task.getAssignees().clear();
        if (request.assigneeIds() != null && !request.assigneeIds().isEmpty()) {
            var found = employees.findAllById(request.assigneeIds());
            if (found.size() != request.assigneeIds().size()) {
                throw new NotFoundException("Some assignees do not exist");
            }
            task.setAssignees(new HashSet<>(found));
        }
    }

    private Task getOrThrow(Long id) {
        return tasks.findById(id).orElseThrow(() -> new NotFoundException("Task", id));
    }
}
