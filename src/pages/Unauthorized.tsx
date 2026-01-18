import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Access Denied</h1>
          <p className="text-lg text-slate-400">
            You don't have permission to access this resource
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
