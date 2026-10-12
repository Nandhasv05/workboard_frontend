import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { Plus, MoreVertical, Calendar, Layout } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data } = await api.get('/projects');
        setProjects(data.projects || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading projects..." sublabel="Fetching workspace project list" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your team's projects and boards.</p>
        </div>
        <Link 
          to="/boards" 
          className="flex items-center gap-2 bg-[#0052cc] hover:bg-[#0065ff] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Plus size={18} /> New Board
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-xl shadow-xs hover:shadow-md transition-all group">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-inner flex items-center justify-center text-white font-bold text-xl">
                  {project.name.charAt(0)}
                </div>
                <button className="text-gray-400 hover:text-gray-700 p-1"><MoreVertical size={18} /></button>
              </div>
              <h3 className="font-bold text-lg text-gray-900 tracking-tight mb-1">{project.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 h-10 mb-4">{project.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between text-xs font-medium text-gray-500 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1.5"><Calendar size={14} /> {project.status.toUpperCase()}</div>
                <Link to={`/projects/${project.id}/board`} className="text-blue-600 hover:underline font-semibold flex items-center gap-1">
                  <Layout size={14} /> Open Board &rarr;
                </Link>
              </div>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No projects found. Create one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
