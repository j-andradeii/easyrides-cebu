export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to EasyRides App
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A Next.js 15 application with enterprise-grade architecture featuring
            Zustand state management, Zod validation, and react-hook-form
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <ArchitectureCard
            title="State Management"
            description="Zustand stores with persistence, resettable patterns, and pub-sub events"
            items={["user.store.ts", "resettable.store.ts", "event.store.ts"]}
          />
          <ArchitectureCard
            title="API Client"
            description="Fetch wrapper with interceptors, token management, and error handling"
            items={["api-client.ts", "Request interceptors", "Event emissions"]}
          />
          <ArchitectureCard
            title="Form Validation"
            description="Zod schemas integrated with react-hook-form for type-safe forms"
            items={["FormInput", "FormTextarea", "FormSelect"]}
          />
          <ArchitectureCard
            title="Route Guards"
            description="Next.js middleware and client-side guards for protected routes"
            items={["middleware.ts", "AuthGuard", "Role-based access"]}
          />
          <ArchitectureCard
            title="Feature Modules"
            description="Modular feature organization with components, hooks, and services"
            items={["components/", "hooks/", "services/"]}
          />
          <ArchitectureCard
            title="Utilities & Config"
            description="Type-safe configuration, constants, and helper functions"
            items={["config.ts", "constants.ts", "utils.ts"]}
          />
        </div>

        {/* Directory Structure */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Structure</h2>
          <div className="bg-gray-50 rounded p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700">{`src/
├── app/              # Next.js App Router
├── assets/           # Static resources
├── components/       # Shared UI components
├── core/            # Utilities & constants
├── guards/          # Route protection
├── hooks/           # Custom React hooks
├── layouts/         # Page templates
├── models/          # TypeScript types
├── modules/         # Feature modules
├── services/        # API services
└── stores/          # Zustand stores`}</pre>
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Getting Started</h2>
          <div className="bg-blue-50 rounded-lg p-8 max-w-3xl mx-auto">
            <ol className="text-left space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-2">1.</span>
                <span>Copy <code className="bg-white px-2 py-1 rounded">.env.local.example</code> to <code className="bg-white px-2 py-1 rounded">.env.local</code> and configure your environment variables</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-2">2.</span>
                <span>Review the example feature module in <code className="bg-white px-2 py-1 rounded">src/modules/example-feature/</code></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-2">3.</span>
                <span>Check out the Zustand store patterns in <code className="bg-white px-2 py-1 rounded">src/stores/</code></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-600 mr-2">4.</span>
                <span>See form validation examples in <code className="bg-white px-2 py-1 rounded">src/components/ExampleLoginForm.tsx</code></span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ArchitectureCardProps {
  title: string;
  description: string;
  items: string[];
}

function ArchitectureCard({ title, description, items }: ArchitectureCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className="text-sm text-gray-500 flex items-center">
            <span className="text-blue-500 mr-2">•</span>
            <code className="bg-gray-50 px-2 py-0.5 rounded text-xs">{item}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
