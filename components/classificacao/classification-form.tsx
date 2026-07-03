
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Classification, Product } from "@/types/classification";
import { maskPlate } from "@/lib/utils";

interface ClassificationFormProps {
  onAddClassification?: (data: Omit<Classification, "id" | "createdAt" | "status">) => void;
  onUpdateClassification?: (id: string, data: Partial<Omit<Classification, "id">>) => void;
  currentUser: any;
  initialData?: Classification;
  children: React.ReactNode;
}

export function ClassificationForm({ 
  onAddClassification, 
  onUpdateClassification, 
  currentUser, 
  initialData, 
  children 
}: ClassificationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [plate, setPlate] = useState("");
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [riPercentage, setRiPercentage] = useState<number | undefined>(undefined);
  const [humidity, setHumidity] = useState<number | undefined>(undefined);
  const [observations, setObservations] = useState("");

  const isEditMode = !!initialData;

  useEffect(() => {
    if (initialData) {
      setPlate(initialData.plate || "");
      setProduct(initialData.product || undefined);
      setInvoiceNumber(initialData.invoiceNumber || "");
      setRiPercentage(initialData.riPercentage || undefined);
      setHumidity(initialData.humidity || undefined);
      setObservations(initialData.observations || "");
    }
  }, [initialData]);

  const handleSubmit = () => {
    const formattedPlate = maskPlate(plate);
    if (formattedPlate.length < 7) {
      alert("Placa inválida");
      return;
    }

    const classificationData = {
      plate: formattedPlate,
      product,
      invoiceNumber,
      riPercentage,
      humidity,
      observations,
      createdBy: isEditMode ? initialData.createdBy : currentUser.username,
      department: isEditMode ? initialData.department : currentUser.department,
    };

    if (isEditMode && onUpdateClassification && initialData.id) {
      onUpdateClassification(initialData.id, classificationData);
    } else if (onAddClassification) {
      onAddClassification(classificationData);
    }

    // Reset form and close dialog
    if (!isEditMode) {
        setPlate("");
        setProduct(undefined);
        setInvoiceNumber("");
        setRiPercentage(undefined);
        setHumidity(undefined);
        setObservations("");
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Caminhão" : "Registrar Novo Caminhão"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Placa (AAA-1234 ou AAA1B23)"
            value={plate}
            onChange={(e) => setPlate(maskPlate(e.target.value))}
            maxLength={8}
          />
          <Select onValueChange={(value) => setProduct(value as Product)} value={product}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acucar">Açúcar</SelectItem>
              <SelectItem value="soja">Soja</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Número da Nota Fiscal"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Porcentagem de R.I (%)"
            value={riPercentage || ""}
            onChange={(e) => setRiPercentage(e.target.value ? Number(e.target.value) : undefined)}
          />
          {product === "soja" && (
            <Input
              type="number"
              placeholder="Umidade (%)"
              value={humidity || ""}
              onChange={(e) => setHumidity(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}
          <Textarea
            placeholder="Observações"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>{isEditMode ? "Salvar Alterações" : "Adicionar Caminhão"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
