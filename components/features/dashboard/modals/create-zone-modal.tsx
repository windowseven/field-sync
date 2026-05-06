'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

interface CreateZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

export function CreateZoneModal({ open, onOpenChange, onSubmit }: CreateZoneModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coordinates: '',
    radius: '5',
    priority: 'medium',
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      onSubmit(formData);
      setFormData({ name: '', description: '', coordinates: '', radius: '5', priority: 'medium' });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Zone</DialogTitle>
          <DialogDescription>Define a new geographic zone for field operations</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone-name">Zone Name</Label>
            <Input
              id="zone-name"
              placeholder="e.g., Zone A"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zone-description">Description</Label>
            <Textarea
              id="zone-description"
              placeholder="Zone details and boundaries..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border-border resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinates">Center Coordinates (Lat,Long)</Label>
            <Input
              id="coordinates"
              placeholder="40.7128,-74.0060"
              value={formData.coordinates}
              onChange={(e) => setFormData({...formData, coordinates: e.target.value})}
              className="border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.radius}
                onChange={(e) => setFormData({...formData, radius: e.target.value})}
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            Create Zone
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

