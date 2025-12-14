import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Text } from '../components';
import './TrainingBuilder.css';

export const TrainingBuilder: React.FC = () => {
  const { trainingPrograms, modules, lessons, fetchTrainingPrograms, fetchModules, fetchLessons, loading } = useAppStore();

  useEffect(() => {
    fetchTrainingPrograms();
    fetchModules();
    fetchLessons();
  }, [fetchTrainingPrograms, fetchModules, fetchLessons]);

  return (
    <div className="training-builder-page">
      <header className="training-builder-header">
        <Text variant="heading">Training Builder</Text>
      </header>

      <div className="training-builder-content">
        <div className="training-builder-section">
          <Text variant="subheading">Training Programs</Text>
          {loading.trainingPrograms ? (
            <Text variant="body">Loading...</Text>
          ) : trainingPrograms.length === 0 ? (
            <Text variant="body">No training programs found.</Text>
          ) : (
            <div className="programs-list">
              {trainingPrograms.map((program) => (
                <div key={program.id} className="program-card">
                  <Text variant="body" bold>
                    {program.program_name}
                  </Text>
                  <Text variant="caption">{program.description}</Text>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="training-builder-section">
          <Text variant="subheading">Modules</Text>
          {loading.modules ? (
            <Text variant="body">Loading...</Text>
          ) : modules.length === 0 ? (
            <Text variant="body">No modules found.</Text>
          ) : (
            <div className="modules-list">
              {modules.map((module) => (
                <div key={module.id} className="module-card">
                  <Text variant="body" bold>
                    {module.module_name}
                  </Text>
                  <Text variant="caption">{module.description}</Text>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="training-builder-section">
          <Text variant="subheading">Lessons</Text>
          {loading.lessons ? (
            <Text variant="body">Loading...</Text>
          ) : lessons.length === 0 ? (
            <Text variant="body">No lessons found.</Text>
          ) : (
            <div className="lessons-list">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="lesson-card">
                  <Text variant="body" bold>
                    {lesson.lesson_name}
                  </Text>
                  <Text variant="caption">Type: {lesson.content_type}</Text>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

