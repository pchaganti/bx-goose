import { useModel } from './ModelContext'; // Import the useModel hook
import { Model } from './ModelContext';
import { useMemo } from 'react';
import { gooseModels } from './GooseModels';
import { toastError, toastSuccess } from '../../../toasts';
import { initializeSystem } from '../../../utils/providerUtils';
import { useRecentModels } from './RecentModels';

export function useHandleModelSelection() {
  const { switchModel, currentModel } = useModel(); // Access switchModel via useModel
  const { addRecentModel } = useRecentModels(); // Access addRecentModel from useRecentModels

  return async (model: Model, componentName?: string) => {
    try {
      // Check if the selected model is already the active model
      if (currentModel && currentModel.id === model.id) {
        console.log(`[${componentName}] Selected model is already active: ${model.name}`);
        return;
      }

      // Call the context's switchModel to update the model
      switchModel(model);

      // Keep track of the recently used models
      addRecentModel(model);

      // switch models via the backend
      // initialize agent
      await initializeSystem(model.provider.toLowerCase(), model.name);

      // Log to the console for tracking
      console.log(`[${componentName}] Switched to model: ${model.name} (${model.provider})`);

      // Display a success toast notification
      toastSuccess({
        title: 'Model changed',
        msg: `Switched to ${model.alias ?? model.name}`,
      });
    } catch (error) {
      // Handle errors gracefully
      console.error(`[${componentName}] Failed to switch model:`, error);
      // Display an error toast notification
      toastError({
        title: model.name,
        msg: `Failed to switch to model`,
        traceback: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

export function createSelectedModel(selectedProvider: string, modelName: string) {
  let selectedModel = gooseModels.find(
    (model) =>
      model.provider.toLowerCase() === selectedProvider &&
      model.name.toLowerCase() === modelName.toLowerCase()
  );

  if (!selectedModel) {
    // Normalize the casing for the provider using the first matching model
    const normalizedProvider =
      gooseModels.find((model) => model.provider.toLowerCase() === selectedProvider)?.provider ||
      selectedProvider;

    // Construct a model object
    selectedModel = {
      name: modelName,
      provider: normalizedProvider, // Use normalized provider
    };
  }

  return selectedModel;
}

export function useFilteredModels(search: string, activeKeys: string[]) {
  const filteredModels = useMemo(() => {
    const modelOptions = gooseModels.filter((model) => activeKeys.includes(model.provider));

    if (!search) {
      return modelOptions; // Return all models if no search term
    }

    return modelOptions.filter((model) => model.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, activeKeys]);

  return filteredModels;
}
