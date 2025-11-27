import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NetworkGraph } from '../NetworkGraph';
import { NetworkNode, NetworkEdge } from '../../../types';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'person.network.tooltip.cvr' && options?.cvr) {
        return `CVR: ${options.cvr}`;
      }
      return key;
    }
  })
}));

const mockNodes: NetworkNode[] = [
  {
    id: 'node1',
    label: 'Test Person',
    sublabel: 'Director',
    type: 'person',
    x: 100,
    y: 100,
    riskLevel: 'High',
    status: 'active',
    clusterId: 'management',
    isHighlighted: true,
    size: 1.2,
    connections: 3,
    notes: 'Primary contact'
  },
  {
    id: 'node2',
    label: 'Test Company',
    sublabel: 'Holding',
    type: 'company',
    x: 200,
    y: 200,
    riskLevel: 'Medium',
    status: 'active',
    clusterId: 'holding',
    isHighlighted: false,
    size: 1.0,
    connections: 2,
    cvr: '12345678',
    notes: 'Main holding company'
  },
  {
    id: 'node3',
    label: 'Historical Entity',
    sublabel: 'Inactive',
    type: 'historical',
    x: 300,
    y: 300,
    riskLevel: 'Low',
    status: 'inactive',
    clusterId: 'historical',
    isHighlighted: false,
    size: 0.8,
    connections: 1
  }
];

const mockEdges: NetworkEdge[] = [
  {
    from: 'node1',
    to: 'node2',
    type: 'ownership',
    weight: 3,
    isHighlighted: true,
    label: '100%'
  },
  {
    from: 'node2',
    to: 'node3',
    type: 'historical',
    weight: 1,
    isHighlighted: false,
    label: 'Former'
  }
];

describe('NetworkGraph', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders all nodes', async () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      // Wait for lazy loading to complete
      await vi.waitFor(() => {
        expect(screen.getByText('Test Person')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByText('Test Company')).toBeInTheDocument();
      expect(screen.getByText('Historical Entity')).toBeInTheDocument();
    });

    it('renders edges between nodes', async () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      await vi.waitFor(() => {
        const lines = document.querySelectorAll('line');
        expect(lines.length).toBeGreaterThanOrEqual(1);
      }, { timeout: 2000 });
    });

    it('renders legend', () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('High Risk')).toBeInTheDocument();
      expect(screen.getByText('Medium Risk')).toBeInTheDocument();
    });
  });

  describe('Clustering', () => {
    it('renders clusters when enabled', async () => {
      render(
        <NetworkGraph
          nodes={mockNodes}
          edges={mockEdges}
          enableClustering={true}
        />
      );

      await vi.waitFor(() => {
        // Clusters are rendered as dashed circles
        const dashedCircles = document.querySelectorAll('circle[stroke-dasharray]');
        expect(dashedCircles.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it('does not render clusters when disabled', async () => {
      render(
        <NetworkGraph
          nodes={mockNodes}
          edges={mockEdges}
          enableClustering={false}
        />
      );

      await vi.waitFor(() => {
        // Should not have cluster circles with dashed stroke
        const dashedCircles = document.querySelectorAll('circle[stroke-dasharray="5 5"]');
        expect(dashedCircles.length).toBe(0);
      }, { timeout: 2000 });
    });
  });

  describe('Interaction', () => {
    it('calls onNodeClick when node is clicked', async () => {
      const onNodeClick = vi.fn();
      render(
        <NetworkGraph
          nodes={mockNodes}
          edges={mockEdges}
          onNodeClick={onNodeClick}
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByText('Test Person')).toBeInTheDocument();
      }, { timeout: 2000 });

      const nodeGroup = screen.getByText('Test Person').closest('g');
      if (nodeGroup) {
        fireEvent.click(nodeGroup);
        expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({
          id: 'node1',
          label: 'Test Person'
        }));
      }
    });

    it('shows tooltip on hover', async () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      await vi.waitFor(() => {
        expect(screen.getByText('Test Company')).toBeInTheDocument();
      }, { timeout: 2000 });

      const nodeGroup = screen.getByText('Test Company').closest('g');
      if (nodeGroup) {
        fireEvent.mouseEnter(nodeGroup);

        await vi.waitFor(() => {
          expect(screen.getByText('CVR: 12345678')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Virtualization', () => {
    it('filters nodes based on viewport when virtualization is enabled', async () => {
      render(
        <NetworkGraph
          nodes={mockNodes}
          edges={mockEdges}
          enableVirtualization={true}
        />
      );

      // All nodes should initially be visible within default viewport
      await vi.waitFor(() => {
        expect(screen.getByText('Test Person')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('shows all nodes when virtualization is disabled', async () => {
      render(
        <NetworkGraph
          nodes={mockNodes}
          edges={mockEdges}
          enableVirtualization={false}
        />
      );

      await vi.waitFor(() => {
        expect(screen.getByText('Test Person')).toBeInTheDocument();
        expect(screen.getByText('Test Company')).toBeInTheDocument();
        expect(screen.getByText('Historical Entity')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Visual Indicators', () => {
    it('renders status indicators for nodes', async () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      await vi.waitFor(() => {
        // Status indicators are small circles
        const statusCircles = document.querySelectorAll('circle[r="4"]');
        expect(statusCircles.length).toBeGreaterThanOrEqual(mockNodes.length);
      }, { timeout: 2000 });
    });

    it('renders connection count badges', async () => {
      render(<NetworkGraph nodes={mockNodes} edges={mockEdges} />);

      await vi.waitFor(() => {
        // Connection badges show count for nodes with > 1 connection
        expect(screen.getByText('3')).toBeInTheDocument(); // node1 has 3 connections
        expect(screen.getByText('2')).toBeInTheDocument(); // node2 has 2 connections
      }, { timeout: 2000 });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator during async load', () => {
      const largeNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        label: `Node ${i}`,
        sublabel: 'Test',
        type: 'company' as const,
        x: Math.random() * 700,
        y: Math.random() * 400,
        riskLevel: 'Low' as const,
        status: 'active' as const
      }));

      render(<NetworkGraph nodes={largeNodes} edges={[]} />);

      // Loading indicator should appear initially
      expect(screen.getByText('Loading network...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty graph without errors', () => {
      render(<NetworkGraph nodes={[]} edges={[]} />);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });
  });
});
