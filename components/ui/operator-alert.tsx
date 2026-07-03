
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface OperatorAlertProps {
  message: string;
  from: string;
  onDismiss: () => void;
  open: boolean;
}

export function OperatorAlert({ message, from, onDismiss, open }: OperatorAlertProps) {
  if (!open) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={onDismiss}>
      <AlertDialogContent className="border-red-500 border-4 shadow-2xl animate-pulse">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl text-red-500">
            <AlertTriangle className="h-8 w-8" />
            ALERTA URGENTE!
          </AlertDialogTitle>
          {/* Correção: Cor do texto alterada para amarelo e negrito para melhor visibilidade */}
          <p className="text-lg text-yellow-400 font-semibold pt-4 whitespace-pre-wrap">
            {message}
          </p>
           <p className="text-sm text-gray-400 pt-2">Enviado por: {from}</p>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDismiss} className="bg-red-600 hover:bg-red-700">
            Ciente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
