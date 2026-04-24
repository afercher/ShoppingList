<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Doctrine\DBAL\Exception as DbalException;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            ExceptionEvent::class => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $request = $event->getRequest();
        $path = $request->getPathInfo();

        // Keep Symfony HTML error pages for non-API pages.
        $isApiPath = str_starts_with($path, '/api/')
            || str_starts_with($path, '/lists')
            || $path === '/api'
            || $path === '/lists';

        if (!$isApiPath) {
            return;
        }

        $exception = $event->getThrowable();

        $status = 500;
        $message = 'Internal server error. Please try again.';

        if ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();
            $message = $exception->getMessage() !== '' ? $exception->getMessage() : 'Request failed.';
        }

        if ($exception instanceof DbalException) {
            $status = 503;
            $message = 'Database unavailable. Please start the backend services.';
        }

        $event->setResponse(new JsonResponse([
            'error' => $message,
        ], $status));
    }
}

