"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Search } from "lucide-react"
import { UserDialog } from "@/components/admin/user-dialog"
import { CredentialsActions } from "@/components/admin/credentials-actions"

interface User {
    _id: string
    name: string
    email: string
    phoneNumber?: string
    accessCode?: string
    role: string
    createdAt: string
    joinDate?: string
}

export default function AdminUsersView() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/users")
            const data = await res.json()
            if (data.success) {
                setUsers(data.users)
            }
        } catch (error) {
            console.error("Failed to fetch users", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Create and manage users for your organization.</p>
                </div>
                <UserDialog onUserCreated={fetchUsers} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        Manage access for your team members.
                    </CardDescription>
                    <div className="flex items-center space-x-2 mt-4">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Access Code</TableHead>
                                    <TableHead>Join Date</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.phoneNumber || "-"}</TableCell>
                                            <TableCell>
                                                <span className="font-mono bg-muted px-2 py-1 rounded text-xs select-all">
                                                    {user.accessCode || "N/A"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <CredentialsActions
                                                    userId={user._id}
                                                    userName={user.name}
                                                    accessCode={user.accessCode}
                                                    email={user.email}
                                                    phoneNumber={user.phoneNumber}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
