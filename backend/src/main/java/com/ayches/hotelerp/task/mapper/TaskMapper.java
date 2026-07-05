package com.ayches.hotelerp.task.mapper;

import com.ayches.hotelerp.person.domain.Employee;
import com.ayches.hotelerp.task.domain.Task;
import com.ayches.hotelerp.task.dto.TaskDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface TaskMapper {

    @Mapping(target = "hotelId", source = "hotel.id")
    @Mapping(target = "hotelName", source = "hotel.name")
    @Mapping(target = "roomId", source = "room.id")
    @Mapping(target = "roomNumber", source = "room.number")
    TaskDto toDto(Task task);

    default TaskDto.AssigneeDto toAssignee(Employee employee) {
        return new TaskDto.AssigneeDto(employee.getId(),
                employee.getFirstName() + " " + employee.getLastName());
    }
}
