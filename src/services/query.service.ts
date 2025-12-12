import { ApiEventStatus, ApiEventType } from "@/models/api-event";
import {apiClient} from "@/services/api-client"
import { useApiEventStore } from "@/stores";

export const submitQuery = async (data: any) => {
    const eventType = ApiEventType.SUBMIT_QUERY;   
    const apiEventStore = useApiEventStore.getState();
    try {
        apiEventStore.sendEvent({type: eventType,  status: ApiEventStatus.IN_PROGRESS, spinner: true });
        await apiClient.post('/api/submit-booking', data)
        apiEventStore.sendEvent({type: eventType,  status: ApiEventStatus.COMPLETED, spinner: true });
    } catch(error) {
        console.log(error);
    }
}
