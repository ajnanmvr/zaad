import { useParams, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Edit, Shield, Activity } from "lucide-react";

import type { IUser, IUserActivity } from "@/types";

export default function UserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, userActivities } = useStore();

    const user = users.find((u: IUser) => u._id === id);
    const activities = userActivities.filter((a: IUserActivity) => a.targetUser === id || a.performedBy === id);

    if (!user) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">User not found</h2>
                <Button className="mt-4" onClick={() => navigate("/users")}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/users")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
                        <p className="text-slate-500 text-sm">{user.email}</p>
                    </div>
                </div>
                <Button onClick={() => navigate(`/users/${id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-indigo-600" /> Account Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-slate-500">Role</span>
                            <span className="font-medium capitalize">{user.role}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-slate-500">Status</span>
                            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {user.status}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-slate-500">Last Login</span>
                            <span className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-orange-600" /> Activity Log
                        </CardTitle>
                        <CardDescription>Recent actions performed by or on this user</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-75 overflow-y-auto pr-2">
                            {activities.length === 0 ? (
                                <p className="text-sm text-slate-500">No activity recorded.</p>
                            ) : (
                                activities.map((act: IUserActivity) => (
                                    <div key={act._id} className="flex gap-4 items-start text-sm">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-300 shrink-0" />
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{act.action.replace('_', ' ').toUpperCase()}</p>
                                            <p className="text-slate-500">{act.details}</p>
                                            <p className="text-xs text-slate-400 mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
