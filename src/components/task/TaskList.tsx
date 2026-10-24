import { useEffect } from "react";
import type { TodoItem } from "../../core/types";
import { useTaskStore } from "../../store/task-store";
import TaskItem from "./TaskItem";
import { TaskSprinkleOverlay } from "./TaskSprinkleOverlay";
import { useAnimatedList } from "./useAnimatedList";

interface TaskListProps {
  tasks: TodoItem[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
  onToggleState: (task: TodoItem) => void;
  onExitingChange?: (hasExiting: boolean) => void;
}

export default function TaskList({
  tasks,
  selectedTaskId,
  onSelectTask,
  onToggleState,
  onExitingChange,
}: TaskListProps) {
  const getTask = useTaskStore((s) => s.getTask);
  const animatedTasks = useAnimatedList(tasks, 400, getTask);

  const hasExiting = animatedTasks.some((t) => t.isExiting);
  useEffect(() => {
    onExitingChange?.(hasExiting);
  }, [hasExiting, onExitingChange]);

  return (
    <div>
      {animatedTasks.map(({ item: task, isExiting }, index) => (
        <TaskItem
          key={task.id}
          task={task}
          isCompleting={isExiting}
          showSeparator={index > 0}
          isSelected={task.id === selectedTaskId}
          onSelect={onSelectTask}
          onToggleState={onToggleState}
        />
      ))}
      <TaskSprinkleOverlay />
    </div>
  );
}
