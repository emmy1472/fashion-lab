'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderKanban,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { garmentStore } from '@/lib/production/store';
import { GarmentCategory, ProjectStatus } from '@/lib/contracts';
import { fetchProjectList, type ProjectListItem } from '@/lib/production/projectList';
import { formatGarmentCategory, getStageById, projectHref } from '@/lib/production/stages';

export function ProjectsDirectory({ openCreate = false }: { openCreate?: boolean }) {
  const router = useRouter();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(openCreate);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<GarmentCategory>('t-shirt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      setProjects(await fetchProjectList());
      setActiveProjectId(garmentStore.getActiveProjectId());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchProjectList().then((list) => {
      if (cancelled) return;
      setProjects(list);
      setActiveProjectId(garmentStore.getActiveProjectId());
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // "New project" links here with ?new=1: open the dialog (also when already on this page)…
  const [prevOpenCreate, setPrevOpenCreate] = useState(openCreate);
  if (openCreate !== prevOpenCreate) {
    setPrevOpenCreate(openCreate);
    if (openCreate) setIsCreateModalOpen(true);
  }
  // …then clear the param so the same link works again.
  useEffect(() => {
    if (openCreate) router.replace('/projects', { scroll: false });
  }, [openCreate, router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          garmentCategory: newProjectCategory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Use the document the API just created (it carries the chosen name), then start at stage 1.
        if (data.gdm?.metadata?.id) {
          garmentStore.hydrateFromGDM(data.gdm);
          router.push(projectHref(data.gdm.metadata.id, 'measurements'));
          return;
        }
      }
      fetchProjects();
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this garment project?')) return;

    try {
      await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
    garmentStore.removeLocalProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleOpenProject = (project: ProjectListItem) => {
    router.push(projectHref(project.id));
  };

  const filteredProjects = projects.filter((p) => {
    const matchesCat = filterCategory === 'all' || p.garment_category === filterCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.garment_category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'production_ready':
        return <Badge tone="success"><CheckCircle2 aria-hidden /> Ready for production</Badge>;
      case 'in_review':
        return <Badge tone="warning"><Clock aria-hidden /> Sample in review</Badge>;
      case 'sample_approved':
        return <Badge tone="info"><Sparkles aria-hidden /> Sample approved</Badge>;
      default:
        return <Badge>Draft</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Projects"
        description="Each project is one garment, taken from measurements through to the showroom."
        actions={
          <>
            <Button variant="secondary" onClick={fetchProjects} aria-label="Refresh projects" title="Refresh">
              <RefreshCw className={isLoading ? 'animate-spin' : ''} aria-hidden />
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus aria-hidden /> New project
            </Button>
          </>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 't-shirt', 'shirt', 'trouser', 'jacket', 'hoodie'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-white text-ink-2 border border-line hover:bg-surface'
              }`}
            >
              {cat === 'all' ? 'All' : formatGarmentCategory(cat)}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or category..."
            className="w-full bg-white border border-line rounded-xl pl-9 pr-4 py-2 text-xs text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-white rounded-2xl border border-line animate-pulse p-6 flex flex-col justify-between" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-line p-12 text-center">
          <FolderKanban className="w-12 h-12 text-muted mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-ink">No Garment Projects Found</h3>
          <p className="text-sm text-ink-2 max-w-sm mx-auto mt-1 mb-4">
            Start with measurements, then draft the pattern, choose a fabric and take it through production.
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus aria-hidden /> New project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const isActive = activeProjectId === proj.id;
            const stage = getStageById(proj.active_stage);
            return (
              <div
                key={proj.id}
                role="link"
                tabIndex={0}
                onClick={() => handleOpenProject(proj)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOpenProject(proj);
                }}
                className={`group bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isActive ? 'border-brand ring-2 ring-brand/10' : 'border-line hover:border-brand/40'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 bg-brand text-white text-xs font-medium px-3 py-0.5 rounded-bl-xl">
                    Last opened
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-xs text-muted">
                        {formatGarmentCategory(proj.garment_category)} · v{proj.version}
                      </span>
                      <h3 className="text-base font-semibold text-ink group-hover:text-brand transition leading-snug mt-0.5">
                        {proj.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 my-3">
                    {getStatusBadge(proj.status)}
                    <span className="text-xs text-muted">
                      {new Date(proj.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-surface-2 flex items-center justify-between text-xs mt-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-brand font-semibold group-hover:underline">
                      {stage ? `Continue: ${stage.name}` : 'Open project'} <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteProject(proj.id, e)}
                    title="Delete Project"
                    className="p-1.5 text-muted hover:text-danger hover:bg-danger-soft rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onKeyDown={(e) => e.key === 'Escape' && setIsCreateModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
            className="bg-card rounded-2xl border border-line shadow-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="new-project-title" className="text-lg font-semibold text-ink">New project</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} aria-label="Close">
                <X aria-hidden />
              </Button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <Field label="Name">
                {(id) => (
                  <Input
                    id={id}
                    required
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g. Heavyweight boxy tee"
                  />
                )}
              </Field>

              <Field
                label="Garment type"
                hint={
                  newProjectCategory === 't-shirt'
                    ? undefined
                    : 'Only T-shirt patterns can be drafted so far. This project will start from the T-shirt block.'
                }
              >
                {(id) => (
                  <Select
                    id={id}
                    value={newProjectCategory}
                    onChange={(e) => setNewProjectCategory(e.target.value as GarmentCategory)}
                  >
                    <option value="t-shirt">T-shirt</option>
                    <option value="shirt">Shirt</option>
                    <option value="hoodie">Hoodie</option>
                    <option value="jacket">Jacket</option>
                    <option value="trouser">Trousers</option>
                    <option value="dress">Dress</option>
                  </Select>
                )}
              </Field>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !newProjectName.trim()}>
                  {isSubmitting ? 'Creating…' : 'Create project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
