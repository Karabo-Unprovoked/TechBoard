import React from 'react';
import { User, Star, Wrench } from 'lucide-react';
import { Technician } from '../types';

interface TechniciansPanelProps {
  technicians: Technician[];
}

const statusColors = {
  available: 'bg-green-100 text-green-800',
  busy: 'bg-red-100 text-red-800',
  'off-duty': 'bg-gray-100 text-gray-800'
};

export const TechniciansPanel: React.FC<TechniciansPanelProps> = ({ technicians }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">Technicians</h3>
      </div>
      
      <div className="space-y-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">{tech.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tech.status]}`}>
                {tech.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star size={14} className="text-yellow-500" />
                <span>{tech.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Wrench size={14} />
                <span>{tech.activeTickets} active</span>
              </div>
              <div className="text-sm text-gray-600">
                {tech.completedToday} completed today
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {tech.specialties.map((specialty) => (
                <span key={specialty} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};