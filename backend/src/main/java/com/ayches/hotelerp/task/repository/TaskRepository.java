package com.ayches.hotelerp.task.repository;

import com.ayches.hotelerp.task.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
    long countByStatus(com.ayches.hotelerp.task.domain.TaskStatus status);
}
