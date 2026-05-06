'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoaderCircle } from 'lucide-react';

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function CreateTeamModal({ open, onOpenChange, onSubmit }: CreateTeamModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leaderId: '',
    maxMembers: '20',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      onSubmit(formData);
      setFormData({ name: '', description: '', leaderId: '', maxMembers: '20' });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Team</DialogTitle>
          <DialogDescription>Add a new team to your field operations system</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              placeholder="e.g., Team Alpha"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              placeholder="Team description and responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leader-id">Team Leader ID</Label>
            <Input
              id="leader-id"
              placeholder="User ID of team leader"
              value={formData.leaderId}
              onChange={(e) => setFormData({...formData, leaderId: e.target.value})}
              className="border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-members">Max Team Members</Label>
            <Input
              id="max-members"
              type="number"
              value={formData.maxMembers}
              onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
              className="border-border"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name}
            className="gap-2"
          >
            {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Create Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

