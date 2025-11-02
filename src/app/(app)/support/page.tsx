'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LifeBuoy, Mail, Phone } from 'lucide-react';

const faqs = [
    {
        question: "How do I reset my password?",
        answer: "You can reset your password from the Settings page. Navigate to Settings > Security and you will find the form to change your password."
    },
    {
        question: "How do I view my assigned jobs?",
        answer: "Your assigned jobs are listed on the main Dashboard page right after you log in. You can click on any job to view more details."
    },
    {
        question: "My certifications are incorrect. How can I update them?",
        answer: "To update your certifications, please contact an administrator. They have the necessary permissions to edit your staff profile and update your qualifications."
    },
    {
        question: "I can't see the Admin section. Why?",
        answer: "The Admin section is only visible to users with 'Admin' access level. If you believe you should have access, please contact your system administrator to have your permissions updated."
    }
]

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <LifeBuoy className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with TrafficFlow, find answers, and contact us.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>Contact Us Directly</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Phone className="h-6 w-6 text-muted-foreground" />
                    <div>
                    <p className="font-semibold">Phone Support</p>
                    <a href="tel:0800123456" className="text-primary hover:underline">
                        0800 123 456
                    </a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                    <div>
                    <p className="font-semibold">Email Support</p>
                    <a href="mailto:support@trafficflow.co.nz" className="text-primary hover:underline">
                        support@trafficflow.co.nz
                    </a>
                    </div>
                </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Your Email</Label>
                    <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="billing">Billing Question</SelectItem>
                        <SelectItem value="feedback">General Feedback</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                    id="message"
                    placeholder="Please describe your issue in detail..."
                    className="min-h-[120px]"
                    />
                </div>
                <Button className="w-full">Submit Ticket</Button>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index + 1}`} key={index}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
