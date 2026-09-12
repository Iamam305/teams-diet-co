"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CopyIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { type Path, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createMeal,
  type DietDay,
  WEEKDAY_LABELS,
  type Weekday,
} from "@/lib/diet-chart";
import type { DietChartFormValues } from "@/lib/validations";

function mealPath(
  weekday: Weekday,
  index: number,
  field: "name" | "content" | "recipeUrl",
) {
  return `days.${weekday}.meals.${index}.${field}` as Path<DietChartFormValues>;
}

function SortableMeal({
  weekday,
  index,
  id,
  name,
  onRemove,
}: {
  weekday: Weekday;
  index: number;
  id: string;
  name: string;
  onRemove: () => void;
}) {
  const { register, setValue } = useFormContext<DietChartFormValues>();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const nameField = register(mealPath(weekday, index, "name"));

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`rounded-xl border bg-card p-3 ${isDragging ? "z-10 opacity-80 shadow-md" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          aria-label={`Reorder ${name}`}
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <Input
          {...nameField}
          onBlur={(event) => {
            nameField.onBlur(event);
            if (!event.target.value.trim()) {
              setValue(mealPath(weekday, index, "name"), "Meal", {
                shouldDirty: true,
              });
            }
          }}
          className="h-8 font-medium"
          aria-label="Meal name"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
      <Textarea
        {...register(mealPath(weekday, index, "content"))}
        placeholder="Diet details for this meal"
        className="mt-3 min-h-24"
      />
      <Input
        {...register(mealPath(weekday, index, "recipeUrl"))}
        placeholder="Recipe video link (optional)"
        className="mt-2"
        inputMode="url"
      />
    </div>
  );
}

export function DietDayEditor({
  weekday,
  canPaste,
  onCopy,
  onPaste,
}: {
  weekday: Weekday;
  canPaste: boolean;
  onCopy: () => void;
  onPaste: () => DietDay | null;
}) {
  const { control } = useFormContext<DietChartFormValues>();
  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: `days.${weekday}.meals`,
    keyName: "fieldId",
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handlePaste() {
    const day = onPaste();
    if (!day) {
      return;
    }
    replace(day.meals);
  }

  function addMeal() {
    if (fields.length >= 20) {
      return;
    }
    append(createMeal("New meal", fields.length));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((meal) => meal.id === active.id);
    const newIndex = fields.findIndex((meal) => meal.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    move(oldIndex, newIndex);
  }

  return (
    <div className="scroll-mt-36 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <ContextMenu>
          <ContextMenuTrigger className="rounded-md px-1 py-0.5">
            <h2 className="font-heading text-lg font-semibold text-primary">
              {WEEKDAY_LABELS[weekday]}
            </h2>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={onCopy}>Copy</ContextMenuItem>
            <ContextMenuItem disabled={!canPaste} onClick={handlePaste}>
              Paste
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addMeal}
            disabled={fields.length >= 20}
          >
            <PlusIcon data-icon="inline-start" />
            Add meal
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`${WEEKDAY_LABELS[weekday]} actions`}
              className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
            >
              <MoreHorizontalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onCopy}>
                <CopyIcon />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canPaste} onClick={handlePaste}>
                Paste
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((meal) => meal.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((meal, index) => (
              <SortableMeal
                key={meal.fieldId}
                weekday={weekday}
                index={index}
                id={meal.id}
                name={meal.name}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {fields.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No meals yet. Add a meal timing to get started.
        </p>
      ) : null}
    </div>
  );
}
