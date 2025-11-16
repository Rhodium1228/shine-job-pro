import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useStaffServices, StaffService } from "@/hooks/useStaffServices";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Plus, Trash2, CheckCircle, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface StaffServicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
}

export const StaffServicesDialog = ({
  open,
  onOpenChange,
  staffId,
  staffName,
}: StaffServicesDialogProps) => {
  const { isAdmin } = useUserRole();
  const { services, isLoading, addService, updateService, approveService, deleteService } =
    useStaffServices(staffId);
  
  const [newService, setNewService] = useState({
    service_name: "",
    base_price: "",
    custom_price: "",
    is_active: true,
    requires_admin_approval: false,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const resetNewService = () => {
    setNewService({
      service_name: "",
      base_price: "",
      custom_price: "",
      is_active: true,
      requires_admin_approval: false,
    });
    setIsAdding(false);
  };

  const handleAddService = () => {
    if (!newService.service_name || !newService.base_price) return;

    addService({
      staffId,
      service: {
        service_name: newService.service_name,
        base_price: parseFloat(newService.base_price),
        custom_price: newService.custom_price ? parseFloat(newService.custom_price) : null,
        is_active: newService.is_active,
        requires_admin_approval: newService.requires_admin_approval,
      },
    });
    resetNewService();
  };

  const handleToggleActive = (service: StaffService) => {
    updateService({
      serviceId: service.id,
      updates: { is_active: !service.is_active },
    });
  };

  const handlePriceUpdate = (service: StaffService, customPrice: string) => {
    updateService({
      serviceId: service.id,
      updates: {
        custom_price: customPrice ? parseFloat(customPrice) : null,
      },
    });
  };

  const handleApprove = (serviceId: string) => {
    approveService(serviceId);
  };

  const handleDeleteClick = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteService(serviceToDelete);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };

  const getEffectivePrice = (service: StaffService) => {
    return service.custom_price ?? service.base_price;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Services - {staffName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add New Service */}
            {!isAdding ? (
              <Button onClick={() => setIsAdding(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            ) : (
              <Card className="p-4 space-y-3 border-primary/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="service_name">Service Name</Label>
                    <Input
                      id="service_name"
                      value={newService.service_name}
                      onChange={(e) =>
                        setNewService({ ...newService, service_name: e.target.value })
                      }
                      placeholder="e.g., Haircut"
                    />
                  </div>
                  <div>
                    <Label htmlFor="base_price">Base Price ($)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={newService.base_price}
                      onChange={(e) =>
                        setNewService({ ...newService, base_price: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_price">Custom Price ($) - Optional</Label>
                    <Input
                      id="custom_price"
                      type="number"
                      step="0.01"
                      value={newService.custom_price}
                      onChange={(e) =>
                        setNewService({ ...newService, custom_price: e.target.value })
                      }
                      placeholder="Leave empty for base price"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={newService.is_active}
                      onCheckedChange={(checked) =>
                        setNewService({ ...newService, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  {!isAdmin && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requires_approval"
                        checked={newService.requires_admin_approval}
                        onCheckedChange={(checked) =>
                          setNewService({ ...newService, requires_admin_approval: checked })
                        }
                      />
                      <Label htmlFor="requires_approval">Requires Admin Approval</Label>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddService} className="flex-1">
                    Add Service
                  </Button>
                  <Button onClick={resetNewService} variant="outline">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {/* Services List */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No services added yet
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <Card key={service.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{service.service_name}</h4>
                          {service.requires_admin_approval ? (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending Approval
                            </Badge>
                          ) : (
                            service.is_active ? (
                              <Badge variant="default" className="text-xs">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Inactive</Badge>
                            )
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Base Price: </span>
                            <span className="font-medium">${service.base_price.toFixed(2)}</span>
                          </div>
                          <div>
                            <Label className="text-xs">Custom Price ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={service.custom_price ?? ""}
                              onBlur={(e) => handlePriceUpdate(service, e.target.value)}
                              placeholder="Use base price"
                              className="h-8"
                            />
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Effective Price: </span>
                          <span className="font-semibold text-primary">
                            ${getEffectivePrice(service).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {isAdmin && service.requires_admin_approval && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(service.id)}
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Switch
                          checked={service.is_active}
                          onCheckedChange={() => handleToggleActive(service)}
                          disabled={service.requires_admin_approval}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteClick(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
