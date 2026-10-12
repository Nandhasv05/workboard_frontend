// AUTHOR : NANDHAKUMAR
// DATE : 2026-10-07
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Briefcase, CheckSquare, Clock, AlertCircle, Trello, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { LoadingSpinner } from '../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: projectsRes } = await api.get('/projects');
        const projects = projectsRes.projects || [];
        setStats({
          totalProjects: projects.length,
          activeProjects: projects.filter((p: any) => p.status === 'active').length,
          totalTasks: 18,
          completedTasks: 6
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" label="Loading dashboard..." sublabel="Calculating project and task stats" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back. Here's what's happening with your workspace today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Briefcase size={24} /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Active Projects</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.activeProjects} <span className="text-xs font-normal text-gray-400">/ {stats.totalProjects}</span></h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><CheckSquare size={24} /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Completed Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTasks} <span className="text-xs font-normal text-gray-400">/ {stats.totalTasks}</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><Clock size={24} /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTasks - stats.completedTasks}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center"><AlertCircle size={24} /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Overdue Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">2</h3>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Links */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Jump into your Boards</h2>
          <p className="text-xs text-gray-500">View cards, move tasks, and track team progress across sprints.</p>
        </div>
        <Link to="/boards" className="bg-[#0052cc] hover:bg-[#0065ff] text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-2">
          <Trello size={16} /> Open Boards &rarr;
        </Link>
      </div>

    </div>
  );
}
