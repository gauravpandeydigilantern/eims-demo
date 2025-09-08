import { FastifyInstance } from 'fastify';
import { DeviceService } from '../services/deviceService';
import { authenticate } from '../plugins/authenticate';

export default async function deviceRoutes(fastify: FastifyInstance) {
  const deviceService = new DeviceService();

  fastify.post(
    '/devices/:id/status',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status, subStatus } = request.body as { status: string; subStatus?: string };

      if (!status) {
        return reply.status(400).send({ error: 'Status is required' });
      }

      try {
        await deviceService.updateDeviceStatus(id, status, subStatus);
        reply.send({ success: true, message: `Device ${id} status updated to ${status}` });
      } catch (error) {
        fastify.log.error(error, `Error updating device ${id} status`);
        reply.status(500).send({ error: 'Failed to update device status' });
      }
    }
  );
}
