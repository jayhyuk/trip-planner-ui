"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import Header from "@/components/Header";
import Modal from "@/components/Modal";
import Spinner from "@/components/Spinner";
import { api } from "@/lib/api";
import { formatDateLong, formatTHB } from "@/lib/format";
import type {
  TodoOption,
  TodoOptionInput,
  TodoOptionUpdateInput,
  TripTodo,
  TripTodoWithOptions,
} from "@/lib/types";

type View = "list" | "compare";

export default function TodoDetailPage() {
  const params = useParams<{ tripKey: string; todoId: string }>();
  const tripKey = decodeURIComponent(params.tripKey);
  const todoId = Number(params.todoId);
  const router = useRouter();

  const [todo, setTodo] = useState<TripTodoWithOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [showAddOption, setShowAddOption] = useState(false);
  const [editingOption, setEditingOption] = useState<TodoOption | null>(null);
  const [showEditTodo, setShowEditTodo] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getTodo(todoId);
      setTodo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todo");
    }
  }, [todoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  async function onDeleteTodo() {
    if (!todo) return;
    if (!confirm("Delete this todo and all its options?")) return;
    try {
      await api.deleteTodo(todo.todo_id);
      router.push(`/trips/${encodeURIComponent(tripKey)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  }

  async function onToggleStatus() {
    if (!todo) return;
    const nextStatus = todo.status === "open" ? "close" : "open";
    try {
      const updated = await api.updateTodo(todo.todo_id, { status: nextStatus });
      setTodo((prev) => (prev ? { ...prev, status: updated.status } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  }

  async function onDeleteOption(optionId: number) {
    if (!confirm("Delete this option?")) return;
    try {
      await api.deleteTodoOption(optionId);
      setTodo((prev) =>
        prev ? { ...prev, options: prev.options.filter((o) => o.option_id !== optionId) } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete option");
    }
  }

  if (error && !todo) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header title="Todo" backHref={`/trips/${encodeURIComponent(tripKey)}`} />
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
          <ErrorBanner message={error} />
        </div>
      </div>
    );
  }

  if (!todo) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header title="Todo" backHref={`/trips/${encodeURIComponent(tripKey)}`} />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        title={todo.todo_name}
        backHref={`/trips/${encodeURIComponent(tripKey)}`}
        action={
          <button
            onClick={() => setShowEditTodo(true)}
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Edit todo"
          >
            ✏️
          </button>
        }
      />

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              todo.status === "close"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {todo.status === "close" ? "✓ Decided" : "● Open"}
          </button>
          <button onClick={onDeleteTodo} className="text-sm font-medium text-red-600 hover:underline">
            Delete todo
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("compare")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "compare" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
              disabled={todo.options.length === 0}
            >
              Compare
            </button>
          </div>
          <Button variant="secondary" onClick={() => setShowAddOption(true)}>
            + Add option
          </Button>
        </div>

        {todo.options.length === 0 && (
          <EmptyState
            icon="🔍"
            title="No options yet"
            description="Add a few options (hotels, flights, etc.) so everyone can compare and decide."
            action={<Button onClick={() => setShowAddOption(true)}>+ Add option</Button>}
          />
        )}

        {todo.options.length > 0 && view === "list" && (
          <ul className="flex flex-col gap-3">
            {todo.options.map((option) => (
              <OptionCard
                key={option.option_id}
                option={option}
                onEdit={() => setEditingOption(option)}
                onDelete={() => onDeleteOption(option.option_id)}
              />
            ))}
          </ul>
        )}

        {todo.options.length > 0 && view === "compare" && <CompareView todoId={todo.todo_id} />}
      </div>

      <AddOptionModal
        open={showAddOption}
        todoId={todo.todo_id}
        onClose={() => setShowAddOption(false)}
        onAdded={(option) => {
          setTodo((prev) => (prev ? { ...prev, options: [...prev.options, option] } : prev));
          setShowAddOption(false);
        }}
      />

      <EditOptionModal
        option={editingOption}
        onClose={() => setEditingOption(null)}
        onSaved={(option) => {
          setTodo((prev) =>
            prev
              ? {
                  ...prev,
                  options: prev.options.map((o) => (o.option_id === option.option_id ? option : o)),
                }
              : prev,
          );
          setEditingOption(null);
        }}
      />

      <EditTodoModal
        open={showEditTodo}
        todo={todo}
        onClose={() => setShowEditTodo(false)}
        onSaved={(updated) => {
          setTodo((prev) => (prev ? { ...prev, ...updated } : prev));
          setShowEditTodo(false);
        }}
      />
    </div>
  );
}

function OptionCard({
  option,
  onEdit,
  onDelete,
}: {
  option: TodoOption;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {option.image_urls.length > 0 && (
        <div className="flex gap-1 overflow-x-auto p-2">
          {option.image_urls.map((url, i) => (
            <div key={i} className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external image URLs from user input */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="p-4 pt-2">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onEdit} className="min-w-0 flex-1 text-left">
            <p className="truncate text-base font-semibold text-slate-900">{option.option_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {option.price != null && (
                <span className="font-medium text-teal-700">{formatTHB(option.price)}</span>
              )}
              {option.option_date && <span>{formatDateLong(option.option_date)}</span>}
            </div>
            {option.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{option.description}</p>
            )}
            {option.detail_link && (
              <a
                href={option.detail_link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-1 inline-block text-sm font-medium text-teal-600 hover:underline"
              >
                View link ↗
              </a>
            )}
          </button>
          <button
            onClick={onDelete}
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete option"
          >
            🗑️
          </button>
        </div>
      </div>
    </li>
  );
}

function CompareView({ todoId }: { todoId: number }) {
  const [columns, setColumns] = useState<string[] | null>(null);
  const [options, setOptions] = useState<TodoOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getTodoComparison(todoId)
      .then((data) => {
        if (!active) return;
        setColumns(data.columns);
        setOptions(data.options);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Failed to load comparison"));
    return () => {
      active = false;
    };
  }, [todoId]);

  if (error) return <ErrorBanner message={error} />;
  if (!columns || !options) return <Spinner />;

  function renderCell(option: TodoOption, column: string) {
    switch (column) {
      case "option_name":
        return option.option_name;
      case "price":
        return option.price != null ? formatTHB(option.price) : "—";
      case "option_date":
        return option.option_date ? formatDateLong(option.option_date) : "—";
      case "description":
        return option.description || "—";
      case "detail_link":
        return option.detail_link ? (
          <a href={option.detail_link} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">
            Link ↗
          </a>
        ) : (
          "—"
        );
      case "image_urls":
        return option.image_urls.length > 0 ? (
          <div className="flex gap-1">
            {option.image_urls.slice(0, 3).map((url, i) => (
              <div key={i} className="relative h-10 w-10 overflow-hidden rounded bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external image URLs from user input */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          "—"
        );
      default:
        return "—";
    }
  }

  const columnLabels: Record<string, string> = {
    option_name: "Option",
    price: "Price (฿)",
    option_date: "Date",
    description: "Notes",
    detail_link: "Link",
    image_urls: "Photos",
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((col) => (
              <th key={col} className="whitespace-nowrap px-3 py-2 font-medium text-slate-600">
                {columnLabels[col] ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {options.map((option) => (
            <tr key={option.option_id} className="border-b border-slate-100 last:border-0">
              {columns.map((col) => (
                <td key={col} className="max-w-[220px] px-3 py-2 align-top text-slate-700">
                  {renderCell(option, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function imageUrlsToText(urls: string[]): string {
  return urls.join("\n");
}

function textToImageUrls(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function AddOptionModal({
  open,
  todoId,
  onClose,
  onAdded,
}: {
  open: boolean;
  todoId: number;
  onClose: () => void;
  onAdded: (option: TodoOption) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [detailLink, setDetailLink] = useState("");
  const [optionDate, setOptionDate] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when modal opens
      setName("");
      setDescription("");
      setPrice("");
      setDetailLink("");
      setOptionDate("");
      setImageUrlsText("");
      setError(null);
    }
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an option name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: TodoOptionInput = {
        option_name: name.trim(),
        description: description.trim() || undefined,
        price: price.trim() ? Number(price) : undefined,
        detail_link: detailLink.trim() || undefined,
        option_date: optionDate || undefined,
        image_urls: textToImageUrls(imageUrlsText),
      };
      const created = await api.addTodoOption(todoId, input);
      onAdded(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add option");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Add option" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="Hotel Sakura"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Price (THB)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              placeholder="2200"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={optionDate}
              onChange={(e) => setOptionDate(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Link</span>
          <input
            type="url"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            placeholder="https://..."
            value={detailLink}
            onChange={(e) => setDetailLink(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Photo URLs <span className="font-normal text-slate-400">(one per line)</span>
          </span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            rows={2}
            placeholder="https://example.com/photo.jpg"
            value={imageUrlsText}
            onChange={(e) => setImageUrlsText(e.target.value)}
          />
        </label>
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Add option
        </Button>
      </form>
    </Modal>
  );
}

function EditOptionModal({
  option,
  onClose,
  onSaved,
}: {
  option: TodoOption | null;
  onClose: () => void;
  onSaved: (option: TodoOption) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [detailLink, setDetailLink] = useState("");
  const [optionDate, setOptionDate] = useState("");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!option) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when option to edit changes
    setName(option.option_name);
    setDescription(option.description ?? "");
    setPrice(option.price != null ? String(option.price) : "");
    setDetailLink(option.detail_link ?? "");
    setOptionDate(option.option_date ?? "");
    setImageUrlsText(imageUrlsToText(option.image_urls));
    setError(null);
  }, [option]);

  if (!option) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!option) return;
    if (!name.trim()) {
      setError("Please enter an option name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const input: TodoOptionUpdateInput = {
        option_name: name.trim(),
        description: description.trim() || null,
        price: price.trim() ? Number(price) : null,
        detail_link: detailLink.trim() || null,
        option_date: optionDate || null,
        image_urls: textToImageUrls(imageUrlsText),
      };
      const updated = await api.updateTodoOption(option.option_id, input);
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update option");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={!!option} title="Edit option" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Price (THB)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              value={optionDate}
              onChange={(e) => setOptionDate(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Notes</span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Link</span>
          <input
            type="url"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={detailLink}
            onChange={(e) => setDetailLink(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">
            Photo URLs <span className="font-normal text-slate-400">(one per line)</span>
          </span>
          <textarea
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base font-mono text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            rows={2}
            value={imageUrlsText}
            onChange={(e) => setImageUrlsText(e.target.value)}
          />
        </label>
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}

function EditTodoModal({
  open,
  todo,
  onClose,
  onSaved,
}: {
  open: boolean;
  todo: TripTodo;
  onClose: () => void;
  onSaved: (todo: TripTodo) => void;
}) {
  const [todoName, setTodoName] = useState(todo.todo_name);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form fields when modal opens
      setTodoName(todo.todo_name);
      setError(null);
    }
  }, [open, todo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!todoName.trim()) {
      setError("Please enter a name.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.updateTodo(todo.todo_id, { todo_name: todoName.trim() });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title="Edit todo" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-base focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
            value={todoName}
            onChange={(e) => setTodoName(e.target.value)}
            required
          />
        </label>
        {error && <ErrorBanner message={error} />}
        <Button type="submit" loading={submitting} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}
