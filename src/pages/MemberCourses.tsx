import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, Clock, ArrowLeft, BookOpen, Video } from "lucide-react";
import { Link } from "react-router-dom";

const MemberCourses = () => {
  const courses = [
    {
      id: 1,
      title: "Automated Trading from Zero to First Bot",
      description: "Complete guide to building your first automated trading system",
      duration: "8 hours",
      modules: 24,
      completedModules: 12,
      difficulty: "Beginner",
      category: "Fundamentals",
      thumbnail: "/lovable-uploads/580e72d2-457e-4e16-8d46-2a0bd9299238.png",
      enrolled: true
    },
    {
      id: 2,
      title: "Advanced Pine Script Mastery",
      description: "Master TradingView Pine Script for custom indicators and strategies",
      duration: "6 hours",
      modules: 18,
      completedModules: 0,
      difficulty: "Advanced",
      category: "Pine Script",
      thumbnail: "/lovable-uploads/ec53698c-ffbe-4a54-93a2-1f451d8eadd1.png",
      enrolled: false
    },
    {
      id: 3,
      title: "Risk Management & Position Sizing",
      description: "Professional risk management techniques for consistent profitability",
      duration: "4 hours",
      modules: 12,
      completedModules: 12,
      difficulty: "Intermediate",
      category: "Risk Management",
      thumbnail: "/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png",
      enrolled: true
    }
  ];

  const handleStartModule = (courseId: number, moduleNumber: number) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'course_module_started', {
        event_category: 'Education',
        event_label: `course_${courseId}_module_${moduleNumber}`
      });
    }
    console.log(`Starting course ${courseId}, module ${moduleNumber}`);
  };

  const handleCompleteModule = (courseId: number, moduleNumber: number) => {
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'course_module_completed', {
        event_category: 'Education', 
        event_label: `course_${courseId}_module_${moduleNumber}`
      });
    }
    console.log(`Completed course ${courseId}, module ${moduleNumber}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Video Course Library
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master automated trading with our comprehensive video courses. From basics to advanced strategies.
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {courses.filter(c => c.enrolled).length}
                </div>
                <div className="text-sm text-muted-foreground">Enrolled Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {courses.reduce((sum, c) => sum + c.completedModules, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Modules Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(courses.reduce((sum, c) => c.enrolled ? sum + (c.completedModules / c.modules) * 100 : sum, 0) / courses.filter(c => c.enrolled).length)}%
                </div>
                <div className="text-sm text-muted-foreground">Average Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {courses.map((course) => {
            const progress = (course.completedModules / course.modules) * 100;
            const isCompleted = course.completedModules === course.modules;
            
            return (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 relative overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500/90 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{course.difficulty}</Badge>
                        <Badge variant="outline">{course.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <span>{course.modules} modules</span>
                  </div>

                  {course.enrolled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.completedModules}/{course.modules} modules</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {course.enrolled ? (
                      <>
                        <Button 
                          className="flex-1"
                          onClick={() => handleStartModule(course.id, course.completedModules + 1)}
                          disabled={isCompleted}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isCompleted ? 'Completed' : 'Continue'}
                        </Button>
                        {!isCompleted && (
                          <Button 
                            variant="outline"
                            onClick={() => handleCompleteModule(course.id, course.completedModules + 1)}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button className="flex-1" variant="outline">
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current Learning Path */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Learning Path</CardTitle>
            <CardDescription>
              Follow this sequence for the most effective learning experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Start with Fundamentals</h4>
                  <p className="text-sm text-muted-foreground">Complete "Automated Trading from Zero to First Bot" to build your foundation.</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex-shrink-0 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Master Risk Management</h4>
                  <p className="text-sm text-muted-foreground">Learn professional risk control before advancing to complex strategies.</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex-shrink-0 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Advanced Scripting</h4>
                  <p className="text-sm text-muted-foreground">Dive deep into Pine Script for custom indicator development.</p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemberCourses;