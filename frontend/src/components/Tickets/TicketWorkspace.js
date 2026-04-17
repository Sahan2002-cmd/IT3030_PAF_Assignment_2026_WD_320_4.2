import React, { useState } from "react";
import { Camera, CheckCircle2, ClipboardList, MapPin, MessageSquare, RefreshCw, Send, Sparkles, Wrench } from "lucide-react";
import {
  addTicketComment,
  assignTicket,
  createTicket,
  deleteTicketComment,
  rejectTicket,
  updateTicketComment,
  updateTicketStatus,
} from "../../services/api";
import {
  ADMIN_STATUS_OPTIONS,
  labelize,
  TECHNICIAN_STATUS_OPTIONS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "./ticketOptions";

const emptyCreateForm = {
  title: "",
  resourceName: "",
  location: "",
  category: "PROJECTOR",
  description: "",
  priority: "MEDIUM",
  preferredContactName: "",
  preferredContactEmail: "",
  preferredContactPhone: "",
  attachments: [],
};

function statCard(label, value, tone) {
  return (
    <article className={`rounded-[24px] border p-5 ${tone}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-extrabold text-primary">{value}</p>
    </article>
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString();
}

function statusTone(status) {
  switch (status) {
    case "OPEN":
      return "bg-amber-100 text-amber-800";
    case "IN_PROGRESS":
      return "bg-sky-100 text-sky-800";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-800";
    case "CLOSED":
      return "bg-slate-200 text-slate-700";
    case "REJECTED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function priorityTone(priority) {
  switch (priority) {
    case "URGENT":
      return "bg-rose-100 text-rose-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "MEDIUM":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

function commentRoleTheme(role) {
  switch (role) {
    case "ADMIN":
      return {
        card: "border-rose-200 bg-rose-50/85",
        badge: "bg-rose-100 text-rose-700",
        accent: "bg-rose-500",
      };
    case "TECHNICIAN":
      return {
        card: "border-cyan-200 bg-cyan-50/85",
        badge: "bg-cyan-100 text-cyan-700",
        accent: "bg-cyan-500",
      };
    default:
      return {
        card: "border-violet-200 bg-violet-50/85",
        badge: "bg-violet-100 text-violet-700",
        accent: "bg-violet-500",
      };
  }
}

async function filesToAttachments(fileList) {
  const files = Array.from(fileList).slice(0, 3);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ fileName: file.name, dataUrl: reader.result });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

function TicketWorkspace({
  mode,
  user,
  token,
  dashboard,
  technicians = [],
  onRefresh,
  allowCreate = false,
  showAssignment = false,
}) {
  const tickets = dashboard?.tickets || [];
  const [createForm, setCreateForm] = useState(() => ({
    ...emptyCreateForm,
    preferredContactName: user?.name || "",
    preferredContactEmail: user?.email || "",
    preferredContactPhone: user?.mobileNumber || "",
  }));
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [editCommentBodies, setEditCommentBodies] = useState({});
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [assignmentDrafts, setAssignmentDrafts] = useState({});
  const [rejectDrafts, setRejectDrafts] = useState({});

  const statusOptions = mode === "admin" ? ADMIN_STATUS_OPTIONS : TECHNICIAN_STATUS_OPTIONS;

  function updateCreateField(name, value) {
    setCreateForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleAttachmentChange(event) {
    try {
      const attachments = await filesToAttachments(event.target.files);
      updateCreateField("attachments", attachments);
      setCreateError("");
    } catch {
      setCreateError("Images could not be loaded. Please try again.");
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setIsCreating(true);

    try {
      const response = await createTicket(createForm, token);
      setCreateSuccess(`Ticket ${response.ticketNumber} created successfully.`);
      setCreateForm({
        ...emptyCreateForm,
        preferredContactName: user?.name || "",
        preferredContactEmail: user?.email || "",
        preferredContactPhone: user?.mobileNumber || "",
      });
      await onRefresh();
    } catch (error) {
      setCreateError(error.message || "Ticket could not be created.");
    } finally {
      setIsCreating(false);
    }
  }

  async function runTicketAction(key, action, successMessage) {
    setBusyKey(key);
    setActionError("");
    setActionSuccess("");

    try {
      await action();
      setActionSuccess(successMessage);
      await onRefresh();
    } catch (error) {
      setActionError(error.message || "Action failed.");
    } finally {
      setBusyKey("");
    }
  }

  function draftStatusFor(ticket) {
    return statusDrafts[ticket.id] || ticket.status;
  }

  function draftAssignmentFor(ticket) {
    return assignmentDrafts[ticket.id] || ticket.assignedTechnicianId || "";
  }

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(186,230,253,0.65),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94),rgba(224,242,254,0.92))] p-6 shadow-[0_24px_70px_rgba(14,165,233,0.12)] backdrop-blur sm:p-8">
        <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute bottom-0 left-20 h-28 w-28 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              <Sparkles size={13} />
              Ticket overview
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-primary">Maintenance flow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Track requests through each step, keep conversations visible, and make actions feel clear for students, technicians, and admins.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="relative z-10 inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white/85 px-5 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
          >
            <RefreshCw size={16} />
            Refresh tickets
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {statCard("Total", dashboard?.totalTickets || 0, "border-slate-200 bg-slate-50/80")}
          {statCard("Open", dashboard?.openTickets || 0, "border-amber-200 bg-amber-50/80")}
          {statCard("In Progress", dashboard?.inProgressTickets || 0, "border-sky-200 bg-sky-50/80")}
          {statCard("Resolved", dashboard?.resolvedTickets || 0, "border-emerald-200 bg-emerald-50/80")}
          {statCard("Closed", dashboard?.closedTickets || 0, "border-slate-200 bg-slate-100/80")}
          {statCard("Rejected", dashboard?.rejectedTickets || 0, "border-rose-200 bg-rose-50/80")}
        </div>
      </section>

      {allowCreate ? (
        <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_24px_70px_rgba(37,99,235,0.08)] backdrop-blur sm:p-8">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(56,189,248,0.22))] text-primary">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">New incident</p>
              <h2 className="mt-2 text-3xl font-extrabold text-primary">Create a maintenance ticket</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Describe the issue, type the resource name manually, set the priority, and attach up to three images as evidence.
              </p>
            </div>
          </div>

          <form className="mt-8 grid gap-5" onSubmit={handleCreateTicket}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Ticket title</span>
                <input
                  value={createForm.title}
                  onChange={(event) => updateCreateField("title", event.target.value)}
                  placeholder="Enter a short title"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Resource name</span>
                <input
                  value={createForm.resourceName}
                  onChange={(event) => updateCreateField("resourceName", event.target.value)}
                  placeholder="Type the resource name manually"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Location</span>
                <input
                  value={createForm.location}
                  onChange={(event) => updateCreateField("location", event.target.value)}
                  placeholder="Room, hall, lab, or building"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Category</span>
                <select
                  value={createForm.category}
                  onChange={(event) => updateCreateField("category", event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                >
                  {TICKET_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {labelize(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-primary">Priority</span>
                <select
                  value={createForm.priority}
                  onChange={(event) => updateCreateField("priority", event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                >
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {labelize(priority)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              value={createForm.description}
              onChange={(event) => updateCreateField("description", event.target.value)}
              placeholder="Describe the incident, visible damage, error message, or urgency."
              rows={5}
              className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
              required
            />

            <div className="grid gap-4 md:grid-cols-3">
              <input
                value={createForm.preferredContactName}
                onChange={(event) => updateCreateField("preferredContactName", event.target.value)}
                placeholder="Preferred contact name"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
              <input
                value={createForm.preferredContactEmail}
                onChange={(event) => updateCreateField("preferredContactEmail", event.target.value)}
                placeholder="Preferred contact email"
                type="email"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
              <input
                value={createForm.preferredContactPhone}
                onChange={(event) => updateCreateField("preferredContactPhone", event.target.value)}
                placeholder="Preferred contact phone"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                required
              />
            </div>

            <label className="rounded-[28px] border border-dashed border-sky-200 bg-[linear-gradient(180deg,rgba(240,249,255,0.95),rgba(224,242,254,0.7))] p-5 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 font-semibold text-primary">
                <Camera size={16} />
                Upload up to 3 images
              </span>
              <input type="file" accept="image/*" multiple className="mt-3 block w-full text-sm" onChange={handleAttachmentChange} />
              {createForm.attachments.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {createForm.attachments.map((attachment) => (
                    <figure key={attachment.fileName} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <img src={attachment.dataUrl} alt={attachment.fileName} className="h-28 w-full object-cover" />
                      <figcaption className="px-3 py-2 text-xs text-slate-500">{attachment.fileName}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : null}
            </label>

            {createError ? (
              <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{createError}</p>
            ) : null}
            {createSuccess ? (
              <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{createSuccess}</p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
              >
                {isCreating ? "Creating..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {actionError ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{actionError}</p>
      ) : null}
      {actionSuccess ? (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{actionSuccess}</p>
      ) : null}

      <section className="grid gap-5">
        {tickets.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white/88 p-10 text-center shadow-[0_20px_60px_rgba(37,99,235,0.06)]">
            <h3 className="text-2xl font-bold text-primary">No tickets yet</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {allowCreate
                ? "Create your first incident ticket to start the maintenance workflow."
                : "Tickets assigned to this view will appear here as soon as they are available."}
            </p>
          </div>
        ) : null}

        {tickets.map((ticket) => (
          <article
            key={ticket.id}
            className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_24px_70px_rgba(37,99,235,0.10)]"
          >
            <div className="border-b border-slate-100 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(255,255,255,0.98),rgba(240,249,255,0.92))] p-6 sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(ticket.status)}`}>
                      {labelize(ticket.status)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityTone(ticket.priority)}`}>
                      {labelize(ticket.priority)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {labelize(ticket.category)}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold text-primary">{ticket.title}</h3>
                  <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">{ticket.description}</p>

                  <div className="mt-5 grid gap-3 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                    <p><span className="font-semibold text-primary">Resource:</span> {ticket.resourceName}</p>
                    <p className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-accent" /><span><span className="font-semibold text-primary">Location:</span> {ticket.location}</span></p>
                    <p><span className="font-semibold text-primary">Created by:</span> {ticket.createdByName}</p>
                    <p><span className="font-semibold text-primary">Assigned:</span> {ticket.assignedTechnicianName || "Unassigned"}</p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/80 bg-white/88 p-4 text-sm text-slate-600 shadow-sm lg:min-w-[280px]">
                  <p><span className="font-semibold text-primary">Preferred contact:</span> {ticket.preferredContactName}</p>
                  <p className="mt-2 break-all">{ticket.preferredContactEmail}</p>
                  <p className="mt-2">{ticket.preferredContactPhone}</p>
                  <p className="mt-4 text-xs text-slate-400">Created {formatDate(ticket.createdAt)}</p>
                  <p className="mt-1 text-xs text-slate-400">Updated {formatDate(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="grid gap-6">
                {ticket.attachments?.length > 0 ? (
                  <section>
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-accent" />
                      <h4 className="text-lg font-bold text-primary">Evidence images</h4>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {ticket.attachments.map((attachment) => (
                        <figure key={`${ticket.id}-${attachment.fileName}`} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
                          <img src={attachment.dataUrl} alt={attachment.fileName} className="h-44 w-full object-cover" />
                          <figcaption className="px-4 py-3 text-xs text-slate-500">{attachment.fileName}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-5">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-accent" />
                    <h4 className="text-lg font-bold text-primary">Comments</h4>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Role colors help you quickly distinguish student updates, technician notes, and admin responses.
                  </p>

                  <div className="mt-4 grid gap-4">
                    {ticket.comments.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
                        No comments yet.
                      </p>
                    ) : (
                      ticket.comments.map((comment) => {
                        const isEditing = editingCommentId === comment.id;
                        const editBody = editCommentBodies[comment.id] ?? comment.body;
                        const theme = commentRoleTheme(comment.authorRole);
                        return (
                          <article key={comment.id} className={`rounded-[24px] border p-4 shadow-sm ${theme.card}`}>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 inline-flex h-3 w-3 rounded-full ${theme.accent}`} />
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-semibold text-primary">{comment.authorName}</h5>
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.badge}`}>
                                      {labelize(comment.authorRole)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-400">{formatDate(comment.updatedAt || comment.createdAt)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {comment.authorId === user?.id ? (
                                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                    You
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {isEditing ? (
                              <textarea
                                rows={3}
                                value={editBody}
                                onChange={(event) =>
                                  setEditCommentBodies((current) => ({
                                    ...current,
                                    [comment.id]: event.target.value,
                                  }))
                                }
                                className="mt-4 w-full rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                              />
                            ) : (
                              <p className="mt-3 text-sm leading-7 text-slate-700">{comment.body}</p>
                            )}

                            {comment.editable || comment.deletable ? (
                              <div className="mt-4 flex flex-wrap gap-3">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        runTicketAction(
                                          `comment-save-${comment.id}`,
                                          () => updateTicketComment(comment.id, { body: editBody }, token),
                                          "Comment updated."
                                        ).then(() => setEditingCommentId(null))
                                      }
                                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-900"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCommentId(null)}
                                      className="rounded-2xl border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : null}

                                {!isEditing && comment.editable ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setEditCommentBodies((current) => ({
                                        ...current,
                                        [comment.id]: comment.body,
                                      }));
                                    }}
                                    className="rounded-2xl border border-white/80 bg-white/85 px-4 py-2 text-xs font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50"
                                  >
                                    Edit
                                  </button>
                                ) : null}

                                {!isEditing && comment.deletable ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runTicketAction(
                                        `comment-delete-${comment.id}`,
                                        () => deleteTicketComment(comment.id, token),
                                        "Comment deleted."
                                      )
                                    }
                                    className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                                  >
                                    Delete
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </article>
                        );
                      })
                    )}
                  </div>

                  {ticket.canComment ? (
                    <div className="mt-5">
                      <textarea
                        rows={3}
                        value={commentDrafts[ticket.id] || ""}
                        onChange={(event) =>
                          setCommentDrafts((current) => ({
                            ...current,
                            [ticket.id]: event.target.value,
                          }))
                        }
                        placeholder="Add a comment or update for this ticket..."
                        className="w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                      />
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          disabled={busyKey === `comment-${ticket.id}`}
                          onClick={() =>
                            runTicketAction(
                              `comment-${ticket.id}`,
                              () => addTicketComment(ticket.id, { body: commentDrafts[ticket.id] || "" }, token),
                              "Comment added."
                            ).then(() =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [ticket.id]: "",
                              }))
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
                        >
                          <Send size={16} />
                          Add comment
                        </button>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>

              <aside className="grid gap-5">
                {(ticket.canUpdateStatus || showAssignment) ? (
                  <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-5">
                    <div className="flex items-center gap-2">
                      <Wrench size={16} className="text-accent" />
                      <h4 className="text-lg font-bold text-primary">Ticket actions</h4>
                    </div>

                    {showAssignment ? (
                      <div className="mt-5">
                        <label className="text-sm font-semibold text-primary">Assigned technician</label>
                        <select
                          value={draftAssignmentFor(ticket)}
                          onChange={(event) =>
                            setAssignmentDrafts((current) => ({
                              ...current,
                              [ticket.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                        >
                          <option value="">Choose technician</option>
                          {technicians.map((technician) => (
                            <option key={technician.id} value={technician.id}>
                              {technician.name} ({technician.email})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busyKey === `assign-${ticket.id}` || !draftAssignmentFor(ticket)}
                          onClick={() =>
                            runTicketAction(
                              `assign-${ticket.id}`,
                              () => assignTicket(ticket.id, { technicianId: Number(draftAssignmentFor(ticket)) }, token),
                              "Technician assigned."
                            )
                          }
                          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-wait disabled:opacity-70"
                        >
                          Assign technician
                        </button>
                      </div>
                    ) : null}

                    {ticket.canUpdateStatus ? (
                      <div className="mt-5">
                        <label className="text-sm font-semibold text-primary">Status</label>
                        <select
                          value={draftStatusFor(ticket)}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [ticket.id]: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                        >
                          {statusOptions.map((option) => (
                            <option key={option} value={option}>
                              {labelize(option)}
                            </option>
                          ))}
                        </select>
                        <textarea
                          rows={4}
                          value={statusDrafts[`notes-${ticket.id}`] || ticket.resolutionNotes || ""}
                          onChange={(event) =>
                            setStatusDrafts((current) => ({
                              ...current,
                              [`notes-${ticket.id}`]: event.target.value,
                            }))
                          }
                          placeholder="Add resolution notes when work starts or completes."
                          className="mt-3 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                        />
                        <button
                          type="button"
                          disabled={busyKey === `status-${ticket.id}`}
                          onClick={() =>
                            runTicketAction(
                              `status-${ticket.id}`,
                              () =>
                                updateTicketStatus(
                                  ticket.id,
                                  {
                                    status: draftStatusFor(ticket),
                                    resolutionNotes: statusDrafts[`notes-${ticket.id}`] || ticket.resolutionNotes || "",
                                  },
                                  token
                                ),
                              "Ticket status updated."
                            )
                          }
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-900 disabled:cursor-wait disabled:opacity-70"
                        >
                          <CheckCircle2 size={16} />
                          Save status
                        </button>
                      </div>
                    ) : null}

                    {ticket.canReject ? (
                      <div className="mt-5 border-t border-slate-200 pt-5">
                        <label className="text-sm font-semibold text-primary">Reject with reason</label>
                        <textarea
                          rows={3}
                          value={rejectDrafts[ticket.id] || ""}
                          onChange={(event) =>
                            setRejectDrafts((current) => ({
                              ...current,
                              [ticket.id]: event.target.value,
                            }))
                          }
                          placeholder="Explain why this ticket is being rejected."
                          className="mt-2 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-primary outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                        />
                        <button
                          type="button"
                          disabled={busyKey === `reject-${ticket.id}`}
                          onClick={() =>
                            runTicketAction(
                              `reject-${ticket.id}`,
                              () => rejectTicket(ticket.id, { reason: rejectDrafts[ticket.id] || "" }, token),
                              "Ticket rejected."
                            )
                          }
                          className="mt-3 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-wait disabled:opacity-70"
                        >
                          Reject ticket
                        </button>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {(ticket.resolutionNotes || ticket.rejectionReason) ? (
                  <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0.96))] p-5">
                    <h4 className="text-lg font-bold text-primary">Outcome notes</h4>
                    {ticket.resolutionNotes ? (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Resolution notes</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{ticket.resolutionNotes}</p>
                      </div>
                    ) : null}
                    {ticket.rejectionReason ? (
                      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">Rejection reason</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{ticket.rejectionReason}</p>
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </aside>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default TicketWorkspace;
