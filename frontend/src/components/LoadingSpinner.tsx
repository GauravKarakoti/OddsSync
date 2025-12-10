export default function LoadingSpinner({ message = 'Loading...', size = 'md', fullScreen = false }) {
    const sizeClasses: any = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
        xl: 'w-20 h-20'
    };

    const spinner = (
        <div className="flex flex-col items-center justify-center">
            <div className={`${sizeClasses[size]} border-4 border-gray-800 border-t-purple-600 rounded-full animate-spin`}></div>
            {message && (
                <div className="mt-4 text-gray-400 animate-pulse">{message}</div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm">
                {spinner}
            </div>
        );
    }

    return spinner;
}