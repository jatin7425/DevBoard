'use client'
import React, { useState } from 'react'
import { Modal, toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { cx, PROJECT_COLORS } from '@/lib/utils'
import { Store } from '@/lib/store'

interface ProjectModalProps {
  project?: any;
  onClose: () => void;
}

export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const editing = !!project;
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.description || "");
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[0]);

  const save = () => {
    if (!name.trim()) return toast("Name is required", "error");
    if (editing) {
      Store.updateProject(project.id, { name: name.trim(), description: desc, color });
      toast("Project updated", "success");
    } else {
      Store.addProject({ name: name.trim(), description: desc, color });
      toast("Project created", "success");
    }
    onClose();
  };

  return (
    <Modal open onClose={onClose} width={460}>
      <div className="modal-head">
        <h3>{editing ? "Edit project" : "New project"}</h3>
        <button className="btn-icon sm" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="modal-body">
        <div className="field mb16">
          <label>Name</label>
          <input className="input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mobile App" onKeyDown={e => e.key === "Enter" && save()} />
        </div>
        <div className="field mb16">
          <label>Description</label>
          <textarea className="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What's this project about?" />
        </div>
        <div className="field">
          <label>Color</label>
          <div className="flex aic gap8" style={{ flexWrap: "wrap" }}>
            {PROJECT_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: c,
                  border: color === c ? "2px solid var(--text)" : "2px solid transparent",
                  outline: color === c ? "none" : "1px solid var(--border-2)",
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save}>{editing ? "Save changes" : "Create project"}</button>
      </div>
    </Modal>
  );
}
