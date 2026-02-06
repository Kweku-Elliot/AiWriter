'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                <span>Dark Mode</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Toggle between light and dark themes.
                </span>
              </Label>
              <ThemeSwitcher />
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="language" className="flex flex-col space-y-1">
                    <span>Language</span>
                     <span className="text-xs font-normal text-muted-foreground">
                        Choose your preferred language.
                    </span>
                </Label>
                <Select defaultValue="en">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es" disabled>Spanish (Coming Soon)</SelectItem>
                        <SelectItem value="fr" disabled>French (Coming Soon)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Information about the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              WryLyt is a powerful AI-powered assistant designed to enhance your writing and productivity. Version 1.0.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
