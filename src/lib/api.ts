export interface TeacherSummary {
    id: number;
    full_name: string;
    avg_rating: number | null;
    reviews_count: number;
    subject?: string | null;
}

export interface ReviewPayload {
    teacher_id: number;
    rating: number;
    comment: string;
    initData: string;
}

const readErrorMessage = async (response: Response) => {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            const payload = await response.json();
            if (payload && typeof payload === "object") {
                const message = (payload as Record<string, unknown>).message;
                const error = (payload as Record<string, unknown>).error;
                if (typeof message === "string" && message.trim()) {
                    return message;
                }
                if (typeof error === "string" && error.trim()) {
                    return error;
                }
            }
        } catch (error) {
            console.error("Failed to parse JSON error response", error);
        }
        return "Не удалось выполнить запрос";
    }

    try {
        const text = await response.text();
        if (text.trim()) {
            return text;
        }
    } catch (error) {
        console.error("Failed to read text error response", error);
    }

    return `Ошибка ${response.status}`;
};

export async function getTeachers(): Promise<TeacherSummary[]> {
    const res = await fetch("/api/teachers");
    if (!res.ok) {
        throw new Error(await readErrorMessage(res));
    }
    return (await res.json()) as TeacherSummary[];
}

export async function sendReview(data: ReviewPayload): Promise<"ok" | "already"> {
    const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (res.status === 201) {
        return "ok";
    }

    if (res.status === 409) {
        return "already";
    }

    throw new Error(await readErrorMessage(res));
}
