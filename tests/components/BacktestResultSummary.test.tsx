/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BacktestResultSummary, WedgeSummary, WedgeWarnings, BacktestResultData } from '../../src/components/BacktestResultSummary';

// Mock the analytics track function
jest.mock('../../src/services/analytics', () => ({
  track: jest.fn(),
}));

const defaultResults: BacktestResultData = {
  totalTrades: 50,
  winRate: 55,
  profitFactor: 1.5,
  maxDrawdown: 12,
  expectancy: 0.5,
};

const defaultProps = {
  results: defaultResults,
  symbol: 'EURUSD',
  timeframe: '1H',
  pattern: 'Double Top',
  runId: 'test-run-123',
  wedgeEnabled: true,
  enabledPatternsCount: 5,
  onCreateAlert: jest.fn(),
  onOpenTradingView: jest.fn(),
  onShareBacktest: jest.fn(),
  isSharing: false,
  linkCopied: false,
};

describe('BacktestResultSummary - Wedge Mode Banner', () => {
  
  describe('Case 1: Accepted > 0, Rejected = 0', () => {
    const wedgeSummary: WedgeSummary = {
      patternCount: 10,
      acceptedCount: 10,
      rejectedCount: 0,
      resolvedFromPatternIdCount: 8,
      resolvedFromIdCount: 2,
      acceptedBaseIds: ['donchian-breakout-long', 'double-top', 'head-shoulders'],
      rejectedBaseIds: [],
    };

    it('shows accepted count with no rejected count', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      expect(screen.getByText('Wedge Mode')).toBeInTheDocument();
      expect(screen.getByText('10/10 accepted')).toBeInTheDocument();
      expect(screen.queryByText(/rejected/i)).not.toBeInTheDocument();
    });

    it('shows resolved from patternId and id stats', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      expect(screen.getByText('Resolved from patternId: 8, id: 2')).toBeInTheDocument();
    });

    it('does NOT show destructive warning', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      expect(screen.queryByText(/No wedge patterns were accepted/)).not.toBeInTheDocument();
    });
  });

  describe('Case 2: Accepted > 0, Rejected > 0', () => {
    const wedgeSummary: WedgeSummary = {
      patternCount: 10,
      acceptedCount: 7,
      rejectedCount: 3,
      resolvedFromPatternIdCount: 5,
      resolvedFromIdCount: 2,
      acceptedBaseIds: ['donchian-breakout-long', 'double-top'],
      rejectedBaseIds: ['unknown-pattern', 'invalid-id', 'missing-base'],
    };

    const wedgeWarnings: WedgeWarnings = {
      rejectedPatternIds: ['x', 'y', 'z'],
      rejectedBaseIds: ['unknown-pattern', 'invalid-id', 'missing-base'],
      acceptedBaseIds: ['donchian-breakout-long', 'double-top'],
      rejectedCount: 3,
      acceptedCount: 7,
      reasons: [
        { rawPatternId: 'x', basePatternId: 'unknown-pattern', reason: 'Not in registry', patternName: 'Unknown', sourceField: 'id' },
        { rawPatternId: 'y', basePatternId: 'invalid-id', reason: 'Invalid format', patternName: 'Invalid', sourceField: 'patternId' },
      ],
      message: '3 pattern(s) were rejected',
    };

    it('shows both accepted and rejected counts', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      expect(screen.getByText('7/10 accepted')).toBeInTheDocument();
      expect(screen.getByText('3 rejected')).toBeInTheDocument();
    });

    it('expands details and shows rejected patterns with reasons', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      // Click to expand
      const viewDetailsBtn = screen.getByRole('button', { name: /view details/i });
      fireEvent.click(viewDetailsBtn);
      
      // Check rejected patterns are listed
      expect(screen.getByText('unknown-pattern')).toBeInTheDocument();
      expect(screen.getByText('invalid-id')).toBeInTheDocument();
      expect(screen.getByText('missing-base')).toBeInTheDocument();
      
      // Check reasons are shown
      expect(screen.getByText('Not in registry')).toBeInTheDocument();
      expect(screen.getByText('Invalid format')).toBeInTheDocument();
    });
  });

  describe('Case 3: Accepted = 0 (Hard Warning)', () => {
    const wedgeSummary: WedgeSummary = {
      patternCount: 5,
      acceptedCount: 0,
      rejectedCount: 5,
      resolvedFromPatternIdCount: 0,
      resolvedFromIdCount: 0,
      acceptedBaseIds: [],
      rejectedBaseIds: ['a', 'b', 'c', 'd', 'e'],
    };

    it('shows hard warning message', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      expect(screen.getByText('No wedge patterns were accepted — strategy may generate no signals.')).toBeInTheDocument();
    });

    it('has destructive styling on the banner', () => {
      const { container } = render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      // The banner should have destructive border class
      const banner = container.querySelector('.border-destructive\\/50');
      expect(banner).toBeInTheDocument();
    });

    it('shows 0/N accepted with destructive text color', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} />);
      
      expect(screen.getByText('0/5 accepted')).toBeInTheDocument();
    });
  });

  describe('Case 4: Overflow cap shows "+N more"', () => {
    const acceptedIds = Array.from({ length: 25 }, (_, i) => `accepted-${i}`);
    const rejectedIds = Array.from({ length: 23 }, (_, i) => `rejected-${i}`);
    
    const wedgeSummary: WedgeSummary = {
      patternCount: 48,
      acceptedCount: 25,
      rejectedCount: 23,
      resolvedFromPatternIdCount: 20,
      resolvedFromIdCount: 5,
      acceptedBaseIds: acceptedIds,
      rejectedBaseIds: rejectedIds,
    };

    const wedgeWarnings: WedgeWarnings = {
      rejectedPatternIds: rejectedIds,
      rejectedBaseIds: rejectedIds,
      acceptedBaseIds: acceptedIds,
      rejectedCount: 23,
      acceptedCount: 25,
      reasons: Array.from({ length: 23 }, (_, i) => ({
        rawPatternId: `raw-${i}`,
        basePatternId: `rejected-${i}`,
        reason: `Reason ${i}`,
        patternName: `Pattern ${i}`,
        sourceField: 'id',
      })),
      message: '23 pattern(s) were rejected',
    };

    it('renders only first 20 accepted patterns', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      // Expand details
      fireEvent.click(screen.getByRole('button', { name: /view details/i }));
      
      // Check first 20 are rendered
      expect(screen.getByText('accepted-0')).toBeInTheDocument();
      expect(screen.getByText('accepted-19')).toBeInTheDocument();
      
      // Check 21st is NOT rendered
      expect(screen.queryByText('accepted-20')).not.toBeInTheDocument();
    });

    it('shows "+5 more" for accepted overflow', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      fireEvent.click(screen.getByRole('button', { name: /view details/i }));
      
      expect(screen.getByText('+5 more')).toBeInTheDocument();
    });

    it('renders only first 20 rejected patterns', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      fireEvent.click(screen.getByRole('button', { name: /view details/i }));
      
      // Check first 20 are rendered
      expect(screen.getByText('rejected-0')).toBeInTheDocument();
      expect(screen.getByText('rejected-19')).toBeInTheDocument();
      
      // Check 21st is NOT rendered
      expect(screen.queryByText('rejected-20')).not.toBeInTheDocument();
    });

    it('shows "+3 more" for rejected overflow', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      fireEvent.click(screen.getByRole('button', { name: /view details/i }));
      
      expect(screen.getByText('+3 more')).toBeInTheDocument();
    });

    it('shows "+3 more reasons" for reasons overflow', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeSummary={wedgeSummary} wedgeWarnings={wedgeWarnings} />);
      
      fireEvent.click(screen.getByRole('button', { name: /view details/i }));
      
      expect(screen.getByText('+3 more reasons')).toBeInTheDocument();
    });
  });

  describe('Wedge mode disabled', () => {
    it('does not render wedge banner when wedgeEnabled is false', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeEnabled={false} wedgeSummary={undefined} />);
      
      expect(screen.queryByText('Wedge Mode')).not.toBeInTheDocument();
    });

    it('does not render wedge banner when wedgeSummary is undefined', () => {
      render(<BacktestResultSummary {...defaultProps} wedgeEnabled={true} wedgeSummary={undefined} />);
      
      expect(screen.queryByText('Wedge Mode')).not.toBeInTheDocument();
    });
  });
});
