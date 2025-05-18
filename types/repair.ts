export type RepairType = 'plumbing' | 'electrical' | 'furniture' | 'other';
export type RepairPriority = 'low' | 'medium' | 'high';
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RepairRequest {
  id: string;
  userId: string;
  roomId: string;
  type: RepairType;
  description: string;
  priority: RepairPriority;
  status: RepairStatus;
  notes?: string;
  assignedTo?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface CreateRepairRequest {
  userId: string;
  roomId: string;
  type: RepairType;
  description: string;
  priority: RepairPriority;
  status: RepairStatus;
  notes?: string;
}

export interface UpdateRepairRequest {
  type?: RepairType;
  description?: string;
  priority?: RepairPriority;
  status?: RepairStatus;
  notes?: string;
  assignedTo?: string;
  completedAt?: number;
} 